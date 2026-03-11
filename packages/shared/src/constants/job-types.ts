export const JOB_TYPES = {
  SCRAPE: 'scrape',
  CONTENT_SAFETY: 'content_safety',
  SUMMARIZE: 'summarize',
  GENERATE_TAGS: 'generate_tags',
} as const

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES]

export const JOB_STATUSES = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type JobStatus = (typeof JOB_STATUSES)[keyof typeof JOB_STATUSES]
