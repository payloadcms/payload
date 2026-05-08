import type { SanitizedConfig, SanitizedPermissions, VisibleEntities } from 'payload'

import { type I18nClient } from '@payloadcms/translations'

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
          type: 'collections',
          entity: collection,
        }

        return entityToGroup
      }) ?? []),
      ...(globals.map((global) => {
        const entityToGroup: EntityToGroup = {
          type: 'globals',
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
