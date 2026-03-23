import { test } from '@japa/runner'
import { BaseJob } from '#jobs/base_job'
import JobService from '#services/job_service'
import JobLog from '#models/job_log'
import Bookmark from '#models/bookmark'
import User from '#models/user'

/** Helper: create a user + bookmark for job log foreign key */
async function createTestBookmark(): Promise<number> {
  const user = await User.create({
    auth0Sub: `auth0|job-test-${crypto.randomUUID()}`,
    email: `job-${crypto.randomUUID()}@test.com`,
    name: 'Job Test User',
    role: 'editor',
  })
  const bookmark = await Bookmark.create({
    userId: user.id,
    url: `https://job-test-${crypto.randomUUID()}.example.com`,
  })
  return bookmark.id
}

/** A simple test job that tracks execution */
class TestJob extends BaseJob {
  readonly name = 'test-job'
  readonly bookmarkId: number
  private readonly _execute: () => Promise<void>
  private readonly _onFail: (error: Error) => Promise<void>

  constructor(
    bookmarkId: number,
    executeFn: () => Promise<void>,
    onFailFn: (error: Error) => Promise<void> = async () => {},
    config: Partial<{ maxAttempts: number; backoffMs: number; backoffMultiplier: number }> = {}
  ) {
    super(config)
    this.bookmarkId = bookmarkId
    this._execute = executeFn
    this._onFail = onFailFn
  }

  async execute(): Promise<void> {
    await this._execute()
  }

  async onFailure(error: Error): Promise<void> {
    await this._onFail(error)
  }
}

test.group('JobService', () => {
  test('executes a job successfully', async ({ assert }) => {
    const bookmarkId = await createTestBookmark()
    const service = new JobService()
    let executed = false

    const job = new TestJob(bookmarkId, async () => {
      executed = true
    })

    await service.enqueue(job)
    assert.isTrue(executed)

    const logs = await JobLog.query().where('bookmarkId', bookmarkId)
    assert.equal(logs.length, 1)
    assert.equal(logs[0].status, 'completed')
    assert.equal(logs[0].jobType, 'test-job')
    assert.equal(logs[0].attempt, 1)
  })

  test('retries on failure with exponential backoff', async ({ assert }) => {
    const bookmarkId = await createTestBookmark()
    const service = new JobService()
    let attempts = 0

    const job = new TestJob(
      bookmarkId,
      async () => {
        attempts++
        if (attempts < 3) throw new Error(`Attempt ${attempts} failed`)
      },
      async () => {},
      { maxAttempts: 3, backoffMs: 10, backoffMultiplier: 2 }
    )

    await service.enqueue(job)
    assert.equal(attempts, 3)

    const logs = await JobLog.query().where('bookmarkId', bookmarkId).orderBy('attempt', 'asc')

    assert.equal(logs.length, 3)
    assert.equal(logs[0].status, 'failed')
    assert.equal(logs[1].status, 'failed')
    assert.equal(logs[2].status, 'completed')
  })

  test('calls onFailure after max attempts exhausted', async ({ assert }) => {
    const bookmarkId = await createTestBookmark()
    const service = new JobService()
    let failureCalled = false
    let failureError: Error | null = null

    const job = new TestJob(
      bookmarkId,
      async () => {
        throw new Error('always fails')
      },
      async (error) => {
        failureCalled = true
        failureError = error
      },
      { maxAttempts: 2, backoffMs: 10, backoffMultiplier: 1 }
    )

    await assert.rejects(() => service.enqueue(job), 'always fails')
    assert.isTrue(failureCalled)
    assert.equal((failureError as Error | null)?.message, 'always fails')
  })

  test('respects concurrency limit', async ({ assert }) => {
    const bookmarkId = await createTestBookmark()
    const service = new JobService({ maxConcurrency: 1 })
    const order: number[] = []

    const job1 = new TestJob(bookmarkId, async () => {
      order.push(1)
      await new Promise((r) => setTimeout(r, 50))
      order.push(2)
    })
    const job2 = new TestJob(bookmarkId, async () => {
      order.push(3)
    })

    await Promise.all([service.enqueue(job1), service.enqueue(job2)])

    // With maxConcurrency=1, job2 should start after job1 finishes
    assert.deepEqual(order, [1, 2, 3])
  })

  test('runs jobs concurrently up to max', async ({ assert }) => {
    const bookmarkId = await createTestBookmark()
    const service = new JobService({ maxConcurrency: 2 })
    let maxConcurrent = 0
    let currentConcurrent = 0

    const makeJob = () =>
      new TestJob(bookmarkId, async () => {
        currentConcurrent++
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
        await new Promise((r) => setTimeout(r, 50))
        currentConcurrent--
      })

    await Promise.all([
      service.enqueue(makeJob()),
      service.enqueue(makeJob()),
      service.enqueue(makeJob()),
    ])

    assert.equal(maxConcurrent, 2)
  })

  test('enqueueAsync does not throw on failure', async ({ assert }) => {
    const bookmarkId = await createTestBookmark()
    const service = new JobService()

    const job = new TestJob(
      bookmarkId,
      async () => {
        throw new Error('fire and forget error')
      },
      async () => {},
      { maxAttempts: 1, backoffMs: 10 }
    )

    // Should not throw
    service.enqueueAsync(job)

    // Wait for the job to process
    await new Promise((r) => setTimeout(r, 100))

    const logs = await JobLog.query().where('bookmarkId', bookmarkId).where('jobType', 'test-job')

    assert.isAbove(logs.length, 0)
    assert.equal(logs[0].status, 'failed')
  })

  test('tracks pending and running counts', async ({ assert }) => {
    const bookmarkId = await createTestBookmark()
    const service = new JobService({ maxConcurrency: 1 })

    assert.equal(service.pendingCount, 0)
    assert.equal(service.runningCount, 0)

    let resolveJob: (() => void) | null = null
    const job = new TestJob(bookmarkId, async () => {
      await new Promise<void>((r) => {
        resolveJob = r
      })
    })

    const promise = service.enqueue(job)

    // Wait for job to start processing
    await new Promise((r) => setTimeout(r, 10))
    assert.equal(service.runningCount, 1)

    resolveJob!()
    await promise
    // Allow the .finally() callback to decrement activeCount
    await new Promise((r) => setTimeout(r, 10))
    assert.equal(service.runningCount, 0)
  })

  test('logs error message on failure', async ({ assert }) => {
    const bookmarkId = await createTestBookmark()
    const service = new JobService()

    const job = new TestJob(
      bookmarkId,
      async () => {
        throw new Error('detailed error message')
      },
      async () => {},
      { maxAttempts: 1, backoffMs: 10 }
    )

    await assert.rejects(() => service.enqueue(job))

    const logs = await JobLog.query().where('bookmarkId', bookmarkId)
    assert.equal(logs[0].errorMessage, 'detailed error message')
  })
})
