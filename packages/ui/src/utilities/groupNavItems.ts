import type { I18nClient } from '@payloadcms/translations'
import type {
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
  StaticLabel,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'

export enum EntityType {
  collection = 'collections',
  global = 'globals',
}

export type EntityToGroup =
  | {
      entity: SanitizedCollectionConfig
      type: EntityType.collection
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

      if (permissions?.[entityToGroup.type.toLowerCase()]?.[entityToGroup.entity.slug]?.read) {
        const translatedGroup = getTranslation(entityToGroup.entity.admin.group, i18n)

        const labelOrFunction =
          'labels' in entityToGroup.entity
            ? entityToGroup.entity.labels.plural
            : entityToGroup.entity.label

        const label =
          typeof labelOrFunction === 'function'
            ? labelOrFunction({ i18n, t: i18n.t })
            : labelOrFunction

        if (entityToGroup.entity.admin.group) {
          const existingGroup = groups.find(
            (group) => getTranslation(group.label, i18n) === translatedGroup,
          ) as NavGroupType

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
          const defaultGroup = groups.find((group) => {
            return getTranslation(group.label, i18n) === i18n.t(`general:${entityToGroup.type}`)
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
    ],
  )

  return result.filter((group) => group.entities.length > 0)
}
