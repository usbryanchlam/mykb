import { DateTime } from 'luxon'
import type { Job, JobStatus } from '#jobs/base_job'
import JobLog from '#models/job_log'

interface QueuedJob {
  readonly job: Job
  readonly resolve: () => void
  readonly reject: (error: Error) => void
}

interface JobServiceConfig {
  readonly maxConcurrency: number
}

const DEFAULT_CONFIG: JobServiceConfig = {
  maxConcurrency: 2,
}

export default class JobService {
  private readonly queue: QueuedJob[] = []
  private activeCount = 0
  private readonly config: JobServiceConfig

  constructor(config: Partial<JobServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async enqueue(job: Job): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.queue.push({ job, resolve, reject })
      this.processNext()
    })
  }

  /**
   * Enqueue a job without waiting for completion (fire-and-forget).
   * Errors are logged but not propagated to the caller.
   */
  enqueueAsync(job: Job): void {
    const promise = new Promise<void>((resolve, reject) => {
      this.queue.push({ job, resolve, reject })
      this.processNext()
    })
    promise.catch(() => {
      // Swallowed intentionally — errors are logged in job_logs
    })
  }

  get pendingCount(): number {
    return this.queue.length
  }

  get runningCount(): number {
    return this.activeCount
  }

  private processNext(): void {
    if (this.activeCount >= this.config.maxConcurrency || this.queue.length === 0) {
      return
    }

    const queued = this.queue.shift()
    if (!queued) return

    this.activeCount++
    this.executeWithRetry(queued.job)
      .then(() => queued.resolve())
      .catch((err) => queued.reject(err))
      .finally(() => {
        this.activeCount--
        this.processNext()
      })
  }

  private async executeWithRetry(job: Job): Promise<void> {
    const { maxAttempts, backoffMs, backoffMultiplier } = job.config

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const log = await this.createLog(job, attempt)

      try {
        await job.execute()
        await this.updateLog(log, 'completed')
        return
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        const isLastAttempt = attempt >= maxAttempts

        if (isLastAttempt) {
          await this.updateLog(log, 'failed', err.message)
          await job.onFailure(err)
          throw err
        }

        await this.updateLog(log, 'failed', err.message)
        const delay = backoffMs * Math.pow(backoffMultiplier, attempt - 1)
        await this.sleep(delay)
      }
    }
  }

  private async createLog(job: Job, attempt: number): Promise<JobLog> {
    return JobLog.create({
      jobType: job.name,
      bookmarkId: job.bookmarkId,
      status: 'processing' as JobStatus,
      attempt,
      startedAt: DateTime.now(),
    })
  }

  private async updateLog(log: JobLog, status: JobStatus, errorMessage?: string): Promise<void> {
    log.merge({
      status,
      errorMessage: errorMessage ?? null,
      completedAt: DateTime.now(),
    })
    await log.save()
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
