import type { Where } from 'payload'

type Args = {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
}

/**
 * Builds the `where` query used to find upcoming scheduled
 * publish/unpublish jobs for a given document or global.
 */
export const buildUpcomingScheduleWhere = ({ id, collectionSlug, globalSlug }: Args): Where => {
  const where: Where = {
    and: [
      {
        taskSlug: {
          equals: 'schedulePublish',
        },
      },
      {
        waitUntil: {
          greater_than: new Date(),
        },
      },
    ],
  }

  if (collectionSlug) {
    where.and.push({
      'input.doc.value': {
        equals: String(id),
      },
    })
    where.and.push({
      'input.doc.relationTo': {
        equals: collectionSlug,
      },
    })
  }

  if (globalSlug) {
    where.and.push({
      'input.global': {
        equals: globalSlug,
      },
    })
  }

  return where
}
