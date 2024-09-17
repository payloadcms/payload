import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientCollectionConfig,
  ClientGlobalConfig,
  Permissions,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'

export enum EntityType {
  collection = 'collections',
  global = 'globals',
}

export type EntityToGroup =
  | {
      entity: ClientCollectionConfig | SanitizedCollectionConfig
      type: EntityType.collection
    }
  | {
      entity: ClientGlobalConfig | SanitizedGlobalConfig
      type: EntityType.global
    }

export type Group = {
  entities: EntityToGroup[]
  label: string
}

export function groupNavItems(
  entities: EntityToGroup[],
  permissions: Permissions,
  i18n: I18nClient,
): Group[] {
  const result = entities.reduce(
    (groups, entityToGroup) => {
      if (
        permissions?.[entityToGroup.type.toLowerCase()]?.[entityToGroup.entity.slug]?.read
          .permission
      ) {
        const translatedGroup = getTranslation(entityToGroup.entity.admin.group, i18n)
        if (entityToGroup.entity.admin.group) {
          const existingGroup = groups.find(
            (group) => getTranslation(group.label, i18n) === translatedGroup,
          ) as Group
          let matchedGroup: Group = existingGroup
          if (!existingGroup) {
            matchedGroup = { entities: [], label: translatedGroup }
            groups.push(matchedGroup)
          }

          matchedGroup.entities.push(entityToGroup)
        } else {
          const defaultGroup = groups.find((group) => {
            return getTranslation(group.label, i18n) === i18n.t(`general:${entityToGroup.type}`)
          }) as Group
          defaultGroup.entities.push(entityToGroup)
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
