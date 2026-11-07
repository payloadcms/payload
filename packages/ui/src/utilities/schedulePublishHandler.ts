import type { PayloadRequest, SchedulePublishTaskInput, ServerFunction } from 'payload'

import { canAccessAdmin, Forbidden } from 'payload'
import { hasScheduledPublishEnabled } from 'payload/shared'

import type { UpcomingEvent } from '../elements/PublishButton/ScheduleDrawer/types.js'

import { buildUpcomingScheduleWhere } from '../elements/PublishButton/ScheduleDrawer/buildUpcomingScheduleWhere.js'
import { getDocumentPermissions } from './getDocumentPermissions.js'

export type SchedulePublishHandlerArgs = {
  date?: Date
  /**
   * The job id to delete to remove a scheduled publish event
   */
  deleteID?: number | string
  localeToPublish?: string
  timezone?: string
} & Pick<SchedulePublishTaskInput, 'doc' | 'global' | 'type'>

export type GetUpcomingScheduledPublishHandlerArgs = {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
}

export const getUpcomingScheduledPublishHandler: ServerFunction<
  GetUpcomingScheduledPublishHandlerArgs,
  Promise<UpcomingEvent[]>
> = async ({ id, collectionSlug, globalSlug, req }) => {
  const { payload } = req

  await canAccessAdmin({ req })

  await assertCanSchedulePublish({ id, collectionSlug, globalSlug, req })

  const { docs } = await payload.db.find<UpcomingEvent>({
    collection: 'payload-jobs',
    limit: 0,
    sort: 'waitUntil',
    where: buildUpcomingScheduleWhere({ id, collectionSlug, globalSlug }),
  })

  return docs.map((job) => ({
    id: job.id,
    input: {
      type: job.input?.type === 'unpublish' ? 'unpublish' : 'publish',
      locale: job.input?.locale,
      timezone: job.input?.timezone,
    },
    waitUntil: job.waitUntil,
  }))
}

export const schedulePublishHandler: ServerFunction<SchedulePublishHandlerArgs> = async ({
  type,
  date,
  deleteID,
  doc,
  global,
  localeToPublish,
  req,
  timezone,
}) => {
  const { i18n, payload, user } = req

  await canAccessAdmin({ req })

  if (deleteID) {
    const scheduledJob = await findScheduledPublishJob({ id: deleteID, req })

    if (!scheduledJob) {
      return { error: `Scheduled publish event with ID ${deleteID} not found` }
    }

    await assertCanSchedulePublish({
      id: scheduledJob.input?.doc?.value,
      collectionSlug: scheduledJob.input?.doc?.relationTo,
      globalSlug: scheduledJob.input?.global,
      req,
    })
  } else {
    await assertCanSchedulePublish({
      id: doc?.value,
      collectionSlug: doc?.relationTo,
      globalSlug: global,
      req,
    })
  }

  try {
    if (deleteID) {
      await payload.delete({
        collection: 'payload-jobs',
        overrideAccess: true,
        req,
        where: {
          and: [{ id: { equals: deleteID } }, { taskSlug: { equals: 'schedulePublish' } }],
        },
      })

      return { message: i18n.t('general:success') }
    }

    await payload.jobs.queue({
      input: {
        type,
        doc,
        global,
        locale: localeToPublish,
        timezone,
        user:
          user && user.collection
            ? {
                relationTo: user.collection,
                value: user.id,
              }
            : undefined,
      },
      overrideAccess: true,
      task: 'schedulePublish',
      waitUntil: date,
    })
  } catch (err) {
    let error

    if (deleteID) {
      error = `Error deleting scheduled publish event with ID ${deleteID}`
    } else {
      error = `Error scheduling ${type} for `
      if (doc) {
        error += `document with ID ${doc.value} in collection ${doc.relationTo}`
      }
    }

    payload.logger.error({ err }, error)

    return {
      error,
    }
  }

  return { message: i18n.t('general:success') }
}

/**
 * Throws `Forbidden` unless the target is a single collection document or a global with
 * scheduled publish enabled, and the requesting user is allowed to publish it.
 */
const assertCanSchedulePublish = async ({
  id,
  collectionSlug,
  globalSlug,
  req,
}: {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  req: PayloadRequest
}): Promise<void> => {
  const { payload } = req

  const collectionConfig = collectionSlug ? payload.collections[collectionSlug]?.config : undefined
  const globalConfig = globalSlug
    ? payload.config.globals.find(({ slug }) => slug === globalSlug)
    : undefined
  const entityConfig = collectionConfig || globalConfig
  const hasValidTarget = Boolean(
    entityConfig &&
    hasScheduledPublishEnabled(entityConfig) &&
    ((collectionConfig && id !== undefined && id !== null && !globalSlug) ||
      (globalConfig && !collectionSlug)),
  )

  if (!hasValidTarget) {
    throw new Forbidden(req.t)
  }

  const { hasPublishPermission } = await getDocumentPermissions({
    id,
    collectionConfig,
    data: {},
    globalConfig,
    req,
  })

  if (!hasPublishPermission) {
    throw new Forbidden(req.t)
  }
}

const findScheduledPublishJob = async ({
  id,
  req,
}: {
  id: number | string
  req: PayloadRequest
}): Promise<{ input?: SchedulePublishTaskInput } | undefined> => {
  const { docs } = await req.payload.db.find<{ input?: SchedulePublishTaskInput }>({
    collection: 'payload-jobs',
    limit: 1,
    pagination: false,
    req,
    where: {
      and: [{ id: { equals: id } }, { taskSlug: { equals: 'schedulePublish' } }],
    },
  })

  return docs[0]
}
