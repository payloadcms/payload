import type { PayloadRequest } from '../types/index.js'

import { type Payload } from '../index.js'
import { jobsCollectionSlug } from '../queues/config/index.js'

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
    await payload.db.deleteMany({
      collection: jobsCollectionSlug,
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
            processing: {
              equals: false,
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
            taskSlug: {
              equals: 'schedulePublish',
            },
          },
        ],
      },
    })
  } catch (err) {
    payload.logger.error({
      err,
      msg: `There was an error deleting scheduled publish jobs from the queue for ${slug} document with ID ${id}.`,
    })
  }
}
