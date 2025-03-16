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
  const defaultGroups: NavGroupType[] = [
    {
      entities: [],
      label: i18n.t('general:collections'),
    },
    {
      entities: [],
      label: i18n.t('general:globals'),
    },
  ]

  const result = entities.reduce((groups, entityToGroup) => {
    // Skip entities where admin.group is explicitly false
    if (entityToGroup.entity?.admin?.group === false) {
      return groups
    }

    if (permissions?.[entityToGroup.type.toLowerCase()]?.[entityToGroup.entity.slug]?.read) {
      const entityLabel =
        'labels' in entityToGroup.entity
          ? entityToGroup.entity.labels.plural
          : entityToGroup.entity.label

      const label = getTranslation(entityLabel, i18n)

      const groupEntity: NavGroupType['entities'][number] = {
        slug: entityToGroup.entity.slug,
        type: entityToGroup.type,
        label,
      }

      let matchedGroup: NavGroupType

      if (entityToGroup.entity.admin.group) {
        const translatedGroup = getTranslation(entityToGroup.entity.admin.group, i18n)
        const existingGroup = groups.find(
          (group) => getTranslation(group.label, i18n) === translatedGroup,
        )

        matchedGroup = existingGroup

        if (!existingGroup) {
          matchedGroup = { entities: [], label: translatedGroup }
          groups.push(matchedGroup)
        }
      } else {
        const translatedGroup = i18n.t(`general:${entityToGroup.type}`)
        const defaultGroup = groups.find(
          (group) => getTranslation(group.label, i18n) === translatedGroup,
        )

        matchedGroup = defaultGroup
      }

      matchedGroup.entities.push(groupEntity)
    }

    return groups
  }, defaultGroups)

  return result.filter((group) => group.entities.length > 0)
}
