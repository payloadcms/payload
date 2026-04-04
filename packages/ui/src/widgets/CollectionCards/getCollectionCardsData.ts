import type { ClientUser, PayloadRequest, SanitizedPermissions } from 'payload'

import { getAccessResults } from 'payload'

import type { NavGroupType } from '../../utilities/groupNavItems.js'

import { getGlobalData } from '../../utilities/getGlobalData.js'
import { getNavGroups } from '../../utilities/getNavGroups.js'
import { getVisibleEntities } from '../../utilities/getVisibleEntities.js'

export type GlobalLockData = {
  data: {
    _isLocked: boolean
    _lastEditedAt: string
    _userEditing: ClientUser | number | string
  }
  lockDuration?: number
  slug: string
}

export type CollectionCardsData = {
  adminRoute: string
  globalData: GlobalLockData[]
  navGroups: NavGroupType[]
  permissions: SanitizedPermissions
  userId: number | string
}

export async function getCollectionCardsData(req: PayloadRequest): Promise<CollectionCardsData> {
  const { payload, user } = req
  const { admin: adminRoute } = payload.config.routes

  const permissions = await getAccessResults({ req })
  const visibleEntities = getVisibleEntities({ req })
  const globalData = await getGlobalData(req)
  const navGroups = getNavGroups(permissions, visibleEntities, payload.config, req.i18n)

  return {
    adminRoute,
    globalData,
    navGroups,
    permissions,
    userId: user?.id,
  }
}
