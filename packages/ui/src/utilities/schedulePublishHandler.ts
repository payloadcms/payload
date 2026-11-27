import type {
  PayloadRequest,
  SchedulePublishTaskInput,
  ServerFunction,
  TypeWithID,
  Where,
} from 'payload'

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

type ScheduledPublishJob = {
  input?: SchedulePublishTaskInput
  taskSlug?: string
} & TypeWithID

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
    const job = await payload.db.findOne<ScheduledPublishJob>({
      collection: 'payload-jobs',
      req,
      where: { id: { equals: deleteID } },
    })

    if (!job || job.taskSlug !== 'schedulePublish') {
      throw new Forbidden(req.t)
    }

    await assertCanSchedulePublish({
      id: job.input?.doc?.value,
      collectionSlug: job.input?.doc?.relationTo,
      globalSlug: job.input?.global,
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
        req,
        where: {
          and: [{ id: { equals: deleteID } }, { taskSlug: { equals: 'schedulePublish' } }],
        },
      })

      return { message: i18n.t('general:success') }
    }

    const publishType = type || 'publish'
    const publishLocale = localeToPublish === 'all' ? undefined : localeToPublish
    if (date) {
      const targetWhere: Where[] = doc
        ? [{ 'input.doc.relationTo': { equals: doc.relationTo } }]
        : [{ 'input.global': { equals: global } }]

      // SQL JSON queries restrict text values. For other custom IDs, narrow by collection
      // and compare the ID below so valid documents can still be scheduled.
      if (doc && /^[\w @.\-+:]*$/.test(String(doc.value))) {
        const id = String(doc.value)
        const ids: (number | string)[] = [id]
        const numericID = Number(id)

        if (Number.isFinite(numericID) && String(numericID) === id) {
          ids.push(numericID)
        }

        targetWhere.push({ 'input.doc.value': { in: ids } })
      }

      const { docs: pendingJobs } = await payload.db.find<ScheduledPublishJob>({
        collection: 'payload-jobs',
        limit: 0,
        req,
        select: { input: true },
        where: {
          and: [
            { taskSlug: { equals: 'schedulePublish' } },
            { waitUntil: { equals: date.toISOString() } },
            { completedAt: { exists: false } },
            { hasError: { not_equals: true } },
            ...targetWhere,
          ],
        },
      })
      const hasDuplicate = pendingJobs.some(({ input }) => {
        const scheduledLocale = input?.locale === 'all' ? undefined : input?.locale
        const hasSameTarget = doc
          ? input?.doc?.relationTo === doc.relationTo &&
            String(input?.doc?.value) === String(doc.value)
          : input?.global === global

        return (
          hasSameTarget &&
          (input?.type || 'publish') === publishType &&
          scheduledLocale === publishLocale
        )
      })

      if (hasDuplicate) {
        return { error: i18n.t('version:duplicateScheduledEvent') }
      }
    }

    await payload.jobs.queue({
      input: {
        type: publishType,
        doc,
        global,
        locale: publishLocale,
        timezone,
        user:
          user && user.collection
            ? {
                relationTo: user.collection,
                value: user.id,
              }
            : undefined,
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

    payload.logger.error({ err, msg: error })

    return {
      error: i18n.t('error:unspecific'),
    }
  }

  return { message: i18n.t('general:success') }
}

/**
 * Throws `Forbidden` unless the target is exactly one collection document or global with
 * scheduled publish enabled, and the current user has publish permission on it.
 */
async function assertCanSchedulePublish({
  id,
  collectionSlug,
  globalSlug,
  req,
}: {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  req: PayloadRequest
}): Promise<void> {
  const { payload } = req

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
}
