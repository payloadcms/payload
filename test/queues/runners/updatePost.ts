import type { JobRunner } from 'payload'
import type { UpdatePostStep1, UpdatePostStep2 } from 'queues/payload-types.js'

export const updatePostStep1: JobRunner<UpdatePostStep1> = async ({ req, step }) => {
  const postID =
    typeof step.post === 'string' || typeof step.post === 'number' ? step.post : step.post.id

  if (!postID) {
    return {
      state: 'failed',
    }
  }

  await req.payload.update({
    collection: 'posts',
    id: postID,
    req,
    data: {
      jobStep1Ran: step.message,
    },
  })

  return {
    state: 'succeeded',
  }
}

export const updatePostStep2: JobRunner<UpdatePostStep2> = async ({ req, step }) => {
  const postID =
    typeof step.post === 'string' || typeof step.post === 'number' ? step.post : step.post.id

  if (!postID) {
    return {
      state: 'failed',
    }
  }

  await req.payload.update({
    collection: 'posts',
    id: postID,
    req,
    data: {
      jobStep2Ran: step.message,
    },
  })

  return {
    state: 'succeeded',
  }
}
