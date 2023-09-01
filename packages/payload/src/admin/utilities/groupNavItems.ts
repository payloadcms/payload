import type { i18n as Ii18n } from 'i18next'

import type { Permissions } from '../../auth'
import type { SanitizedCollectionConfig } from '../../collections/config/types'
import type { SanitizedGlobalConfig } from '../../globals/config/types'

import { getTranslation } from '../../utilities/getTranslation'

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

export type Group = {
  entities: EntityToGroup[]
  label: string
}

export function groupNavItems(
  entities: EntityToGroup[],
  permissions: Permissions,
  i18n: Ii18n,
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
          const defaultGroup = groups.find(
            (group) =>
              getTranslation(group.label, i18n) === i18n.t(`general:${entityToGroup.type}`),
          ) as Group
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
