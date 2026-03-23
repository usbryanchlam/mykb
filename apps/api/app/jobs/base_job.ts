export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface JobConfig {
  readonly maxAttempts: number
  readonly backoffMs: number
  readonly backoffMultiplier: number
}

export const DEFAULT_JOB_CONFIG: JobConfig = {
  maxAttempts: 3,
  backoffMs: 1000,
  backoffMultiplier: 2,
}

export interface Job {
  readonly name: string
  readonly bookmarkId: number
  readonly config: JobConfig

  execute(): Promise<void>
  onFailure(error: Error): Promise<void>
}

export abstract class BaseJob implements Job {
  abstract readonly name: string
  abstract readonly bookmarkId: number

  readonly config: JobConfig

  constructor(config: Partial<JobConfig> = {}) {
    this.config = { ...DEFAULT_JOB_CONFIG, ...config }
  }

  abstract execute(): Promise<void>

  async onFailure(_error: Error): Promise<void> {
    // Override in subclass for custom failure handling
  }
}
