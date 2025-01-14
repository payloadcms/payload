import type { PayloadRequest } from '../types/index.js'

import { type Payload } from '../index.js'

type Args = {
  id?: number | string
  payload: Payload
  req?: PayloadRequest
  slug: string
}

export const deleteScheduledPublishJobs = async ({
  id,
  slug,
  payload,
  req,
}: Args): Promise<void> => {
  try {
    const jobs = await payload.db.find({
      collection: 'payload-jobs',
      req,
    })

    // get the jobs collection
    await payload.db.deleteMany({
      collection: 'payload-jobs',
      req,
      where: {
        and: [
          // only want to delete jobs have not run yet
          {
            completedAt: {
              exists: false,
            },
          },
          {
            'input.doc.value': {
              equals: id,
            },
          },
          {
            'input.doc.relationTo': {
              equals: slug,
            },
          },
          // data.type narrows scheduled publish jobs in case of another job having input.doc.value
          {
            'input.type': {
              exists: true,
            },
          },
        ],
      },
    })
  } catch (err) {
    payload.logger.error(
      `There was an error deleting scheduled publish jobs from the queue for ${slug} document with ID ${id}.`,
    )
  }
}
