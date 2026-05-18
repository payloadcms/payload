import type { InitOptions } from 'payload'

import { wrapPayloadJobsRunnerForNext } from './wrapPayloadJobsRunnerForNext.js'

export const nextAppCronGetPayloadOptions: Pick<
  InitOptions,
  'cron' | 'wrapJobsRunnerInAsyncContext'
> = {
  cron: true,
  wrapJobsRunnerInAsyncContext: wrapPayloadJobsRunnerForNext,
}
