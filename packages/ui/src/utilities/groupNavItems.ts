import type { I18nClient } from '@payloadcms/translations'
import type {
  SanitizedCollectionConfig,
  SanitizedCustomViewConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
  StaticLabel,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'

export enum EntityType {
  collection = 'collections',
  customView = 'customViews',
  global = 'globals',
}

export type EntityToGroup =
  | {
      entity: SanitizedCollectionConfig
      type: EntityType.collection
    }
  | {
      entity: SanitizedCustomViewConfig
      type: EntityType.customView
    }
  | {
      entity: SanitizedGlobalConfig
      type: EntityType.global
    }

export type NavGroupType = {
  entities: {
    label: StaticLabel
    slug: string
    type: EntityType
  }[]
  label: string
}

export function groupNavItems(
  entities: EntityToGroup[],
  permissions: SanitizedPermissions,
  i18n: I18nClient,
): NavGroupType[] {
  const result = entities.reduce(
    (groups, entityToGroup) => {
      // Skip entities where admin.group is explicitly false
      if (entityToGroup.entity?.admin?.group === false) {
        return groups
      }

      // Custom views don't have permissions in the same way as collections/globals
      // They are public by default and should always be included if they pass visibility checks
      const hasPermission =
        entityToGroup.type === EntityType.customView
          ? true // Custom views are public by default
          : permissions?.[entityToGroup.type.toLowerCase()]?.[entityToGroup.entity.slug]?.read

      if (hasPermission) {
        const translatedGroup = getTranslation(entityToGroup.entity.admin?.group, i18n)

        const labelOrFunction =
          'labels' in entityToGroup.entity
            ? entityToGroup.entity.labels?.plural
            : entityToGroup.entity.label

        const label =
          typeof labelOrFunction === 'function'
            ? labelOrFunction({ i18n, t: i18n.t })
            : labelOrFunction || entityToGroup.entity.slug

        if (entityToGroup.entity.admin?.group) {
          const existingGroup = groups.find(
            (group) => getTranslation(group.label, i18n) === translatedGroup,
          )

          let matchedGroup: NavGroupType = existingGroup

          if (!existingGroup) {
            matchedGroup = { entities: [], label: translatedGroup }
            groups.push(matchedGroup)
          }

          matchedGroup.entities.push({
            slug: entityToGroup.entity.slug,
            type: entityToGroup.type,
            label,
          })
        } else {
          const expectedGroupLabel = i18n.t(`general:${entityToGroup.type}`)
          const defaultGroup = groups.find((group) => {
            return getTranslation(group.label, i18n) === expectedGroupLabel
          }) as NavGroupType

          defaultGroup.entities.push({
            slug: entityToGroup.entity.slug,
            type: entityToGroup.type,
            label,
          })
        }
      }

      return groups
    },
    [
      {
        entities: [],
        label: i18n.t('general:collections'),
      },
      {
        entities: [],
        label: i18n.t('general:globals'),
      },
      {
        entities: [],
        label: i18n.t('general:customViews'),
      },
    ],
  )

  return result.filter((group) => group.entities.length > 0)
}
