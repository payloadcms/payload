import type { TaskRunner } from 'payload'

export const externalTaskRunner: TaskRunner<'ExternalTask'> = async ({ input, job, req }) => {
  const newSimple = await req.payload.create({
    collection: 'simple',
    req,
    data: {
      title: input.message,
    },
  })
  return {
    output: {
      simpleID: newSimple.id,
    },
  }
}
