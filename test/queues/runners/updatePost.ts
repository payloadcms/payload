import type { TaskHandler } from 'payload'

export const updatePostStep1: TaskHandler<'UpdatePost'> = async ({ req, input }) => {
  const postID =
    typeof input.post === 'string' || typeof input.post === 'number' ? input.post : input.post.id

  if (!postID) {
    return {
      state: 'failed',
      output: null,
    }
  }

  await req.payload.update({
    collection: 'posts',
    id: postID,
    req,
    data: {
      jobStep1Ran: input.message,
    },
  })

  return {
    state: 'succeeded',
    output: {
      messageTwice: input.message + input.message,
    },
  }
}

export const updatePostStep2: TaskHandler<'UpdatePostStep2'> = async ({ req, input, job }) => {
  const postID =
    typeof input.post === 'string' || typeof input.post === 'number' ? input.post : input.post.id

  if (!postID) {
    return {
      state: 'failed',
      output: null,
    }
  }

  await req.payload.update({
    collection: 'posts',
    id: postID,
    req,
    data: {
      jobStep2Ran: input.messageTwice + job.taskStatus.UpdatePost['1'].output.messageTwice,
    },
  })

  return {
    state: 'succeeded',
    output: null,
  }
}
