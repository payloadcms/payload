import type { Payload, SanitizedCollectionConfig, SanitizedGlobalConfig, User } from 'payload'

import { hasScheduledPublishEnabled } from 'payload/shared'

import { buildUpcomingScheduleWhere } from '../elements/PublishButton/ScheduleDrawer/buildUpcomingScheduleWhere.js'
import { sanitizeID } from './sanitizeID.js'

type Args = {
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  hasPublishPermission?: boolean
  id?: number | string
  payload: Payload
  user: User
}

export const getHasScheduledPublish = async ({
  id: idArg,
  collectionConfig,
  globalConfig,
  hasPublishPermission,
  payload,
  user,
}: Args): Promise<boolean> => {
  const entityConfig = collectionConfig || globalConfig
  const id = sanitizeID(idArg)
  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug

  const canSchedulePublish = Boolean(
    hasScheduledPublishEnabled(entityConfig) &&
      hasPublishPermission &&
      (globalSlug || (collectionSlug && id)),
  )

  if (!canSchedulePublish) {
    return false
  }

  try {
    const { totalDocs } = await payload.count({
      collection: 'payload-jobs',
      overrideAccess: false,
      user,
      where: buildUpcomingScheduleWhere({ id, collectionSlug, globalSlug }),
    })

    return totalDocs > 0
  } catch {
    return false
  }
}
