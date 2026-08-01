import type { SanitizedJobsConfig } from '../config/types/index.js'

export const configHasJobs = (jobsConfig: SanitizedJobsConfig): boolean =>
  Boolean(jobsConfig.tasks?.length || jobsConfig.workflows?.length)
