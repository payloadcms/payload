import type { I18nClient } from '@payloadcms/translations'
import type { NavPreferences, PayloadRequest, SanitizedPermissions, VisibleEntities } from 'payload'

import type { EntityToGroup, NavGroupType } from '../../utilities/groupNavItems.js'

import { EntityType, groupNavItems } from '../../utilities/groupNavItems.js'
import { getNavPrefs } from './getNavPrefs.js'

export type NavData = {
  groups: NavGroupType[]
  navPreferences: NavPreferences
}

export async function getNavData({
  i18n,
  permissions,
  req,
  visibleEntities,
}: {
  i18n: I18nClient
  permissions: SanitizedPermissions
  req: PayloadRequest
  visibleEntities: VisibleEntities
}): Promise<NavData> {
  const { collections, globals } = req.payload.config

  const groups = groupNavItems(
    [
      ...collections
        .filter(({ slug }) => visibleEntities.collections.includes(slug))
        .map(
          (collection) =>
            ({
              type: EntityType.collection,
              entity: collection,
            }) satisfies EntityToGroup,
        ),
      ...globals
        .filter(({ slug }) => visibleEntities.globals.includes(slug))
        .map(
          (global) =>
            ({
              type: EntityType.global,
              entity: global,
            }) satisfies EntityToGroup,
        ),
    ],
    permissions,
    i18n,
  )

  const navPreferences = await getNavPrefs(req)

  return {
    groups,
    navPreferences,
  }
}
