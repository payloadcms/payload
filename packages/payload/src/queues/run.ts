import type { Payload } from '../types/index.js'

export type RunJobsArgs = {
  payload: Payload
  queue?: string
}

export const runJobs = async ({ payload, queue }: RunJobsArgs): Promise<boolean> => {
  await payload.find({
    collection: 'payload-jobs',
    depth: 0,
  })

  console.log({ queue })

  return true
}
