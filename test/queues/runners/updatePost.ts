import type { JobRunner } from 'payload'

type StepType = {
  message: string
  post: string
}

export const updatePostStep1: JobRunner<StepType> = async ({ req, step }) => {
  await req.payload.update({
    collection: 'posts',
    id: step.post,
    data: {
      jobStep1Ran: step.message,
    },
  })

  return {
    state: 'succeeded',
  }
}

export const updatePostStep2: JobRunner<StepType> = async ({ req, step }) => {
  await req.payload.update({
    collection: 'posts',
    id: step.post,
    data: {
      jobStep2Ran: step.message,
    },
  })

  return {
    state: 'succeeded',
  }
}
