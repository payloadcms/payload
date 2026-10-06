import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientCollectionConfig,
  ClientGlobalConfig,
  SanitizedPermissions,
  VisibleEntities,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'

import type { CommandPaletteAction, CommandPaletteGroup } from './types.js'

import { isNavEntityVisible } from '../../utilities/isNavEntityVisible.js'

type BuildActionsArgs = {
  adminRoute: string
  collections: ClientCollectionConfig[]
  globals: ClientGlobalConfig[]
  i18n: I18nClient
  permissions: SanitizedPermissions
  visibleEntities: VisibleEntities
}

/**
 * Derives the grouped command-palette action list from the client config and the
 * current user's permissions. Respects entity visibility (parity with the nav) —
 * entities hidden via `admin.hidden` are excluded when `visibleEntities` is provided.
 * Phase 1 produces navigate + create actions for collections and navigate actions for
 * globals; custom action providers will be merged here in a later phase.
 */
export function buildActions({
  adminRoute,
  collections,
  globals,
  i18n,
  permissions,
  visibleEntities,
}: BuildActionsArgs): CommandPaletteGroup[] {
  const collectionActions: CommandPaletteAction[] = collections
    .filter(
      (entity) =>
        isNavEntityVisible({
          adminGroup: entity.admin.group,
          entityPermissions: permissions?.collections?.[entity.slug],
        }) &&
        (!visibleEntities?.collections || visibleEntities.collections.includes(entity.slug)),
    )
    .map((entity) => {
      const canCreate = Boolean(permissions?.collections?.[entity.slug]?.create)

      return {
        id: `collection-${entity.slug}`,
        type: 'collection' as const,
        createHref: canCreate
          ? formatAdminURL({ adminRoute, path: `/collections/${entity.slug}/create` })
          : undefined,
        href: formatAdminURL({ adminRoute, path: `/collections/${entity.slug}` }),
        label: getTranslation(entity.labels.plural, i18n),
      }
    })

  const globalActions: CommandPaletteAction[] = globals
    .filter(
      (entity) =>
        isNavEntityVisible({
          adminGroup: entity.admin.group,
          entityPermissions: permissions?.globals?.[entity.slug],
        }) &&
        (!visibleEntities?.globals || visibleEntities.globals.includes(entity.slug)),
    )
    .map((entity) => ({
      id: `global-${entity.slug}`,
      type: 'global' as const,
      href: formatAdminURL({ adminRoute, path: `/globals/${entity.slug}` }),
      label: getTranslation(entity.label, i18n),
    }))

  const groups: CommandPaletteGroup[] = []

  if (collectionActions.length > 0) {
    groups.push({ actions: collectionActions, label: i18n.t('general:collections') })
  }

  if (globalActions.length > 0) {
    groups.push({ actions: globalActions, label: i18n.t('general:globals') })
  }

  return groups
}
