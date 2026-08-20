import type { SchedulePublishTaskInput, ServerFunction } from 'payload'

import { canAccessAdmin, docAccessOperation, docAccessOperationGlobal, Forbidden } from 'payload'
import { hasScheduledPublishEnabled } from 'payload/shared'

import type { UpcomingEvent } from '../elements/PublishButton/ScheduleDrawer/types.js'

import { buildUpcomingScheduleWhere } from '../elements/PublishButton/ScheduleDrawer/buildUpcomingScheduleWhere.js'

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

  const collectionConfig = collectionSlug ? payload.collections[collectionSlug]?.config : undefined
  const globalConfig = globalSlug
    ? payload.config.globals.find(({ slug }) => slug === globalSlug)
    : undefined
  const entityConfig = collectionConfig || globalConfig
  const hasValidTarget = Boolean(
    entityConfig &&
      hasScheduledPublishEnabled(entityConfig) &&
      ((collectionConfig && id !== undefined && !globalSlug) || (globalConfig && !collectionSlug)),
  )

  if (!hasValidTarget) {
    throw new Forbidden(req.t)
  }

  const hasPublishPermission = collectionConfig
    ? (
        await docAccessOperation({
          id,
          collection: { config: collectionConfig },
          data: { _status: 'published' },
          req,
        })
      ).update
    : (
        await docAccessOperationGlobal({
          data: { _status: 'published' },
          globalConfig,
          req,
        })
      ).update

  if (!hasPublishPermission) {
    throw new Forbidden(req.t)
  }

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

  try {
    if (deleteID) {
      await payload.delete({
        collection: 'payload-jobs',
        req,
        where: {
          and: [{ id: { equals: deleteID } }, { taskSlug: { equals: 'schedulePublish' } }],
        },
      })
    }

    await payload.jobs.queue({
      input: {
        type,
        doc,
        global,
        locale: localeToPublish,
        timezone,
        user: user.id,
      },
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
