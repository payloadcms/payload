import type { SanitizedConfig, SanitizedPermissions, VisibleEntities } from '@ruya.sa/payload'

import { type I18nClient } from '@ruya.sa/translations'

import { EntityType } from './groupNavItems.js'
import { type EntityToGroup, groupNavItems } from './groupNavItems.js'

/** @internal */
export function getNavGroups(
  permissions: SanitizedPermissions,
  visibleEntities: VisibleEntities,
  config: SanitizedConfig,
  i18n: I18nClient,
) {
  const collections = config.collections.filter(
    (collection) =>
      permissions?.collections?.[collection.slug]?.read &&
      visibleEntities.collections.includes(collection.slug),
  )

  const globals = config.globals.filter(
    (global) =>
      permissions?.globals?.[global.slug]?.read && visibleEntities.globals.includes(global.slug),
  )

  const navGroups = groupNavItems(
    [
      ...(collections.map((collection) => {
        const entityToGroup: EntityToGroup = {
          type: EntityType.collection,
          entity: collection,
        }

        return entityToGroup
      }) ?? []),
      ...(globals.map((global) => {
        const entityToGroup: EntityToGroup = {
          type: EntityType.global,
          entity: global,
        }

        return entityToGroup
      }) ?? []),
    ],
    permissions,
    i18n,
  )

  return navGroups
}
