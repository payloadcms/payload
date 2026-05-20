import type { AdminViewServerProps, ClientUser, Locale } from 'payload'

import type { NavGroupType } from '../../utilities/groupNavItems.js'

import { getGlobalData } from '../../utilities/getGlobalData.js'
import { getNavGroups } from '../../utilities/getNavGroups.js'

export type DashboardData = {
  globalData: Array<{
    data: { _isLocked: boolean; _lastEditedAt: string; _userEditing: ClientUser | number | string }
    lockDuration?: number
    slug: string
  }>
  locale: Locale
  navGroups: NavGroupType[]
}

export async function getDashboardData(props: AdminViewServerProps): Promise<DashboardData> {
  const {
    locale,
    permissions,
    req: {
      i18n,
      payload: { config },
    },
    req,
    visibleEntities,
  } = props.initPageResult

  const globalData = await getGlobalData(req)
  const navGroups = getNavGroups(permissions, visibleEntities, config, i18n)

  return {
    globalData,
    locale,
    navGroups,
  }
}
