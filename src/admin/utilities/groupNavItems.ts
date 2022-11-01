import type { TFunction } from 'react-i18next';
import { Permissions } from '../../auth';
import { SanitizedCollectionConfig } from '../../collections/config/types';
import { SanitizedGlobalConfig } from '../../globals/config/types';

export enum EntityType {
  collection = 'collections',
  global = 'globals'
}

export type EntityToGroup = {
  type: EntityType.collection
  entity: SanitizedCollectionConfig
} | {
  type: EntityType.global
  entity: SanitizedGlobalConfig
}

export type Group = {
  label: string
  entities: EntityToGroup[]
}

export function groupNavItems(entities: EntityToGroup[], permissions: Permissions, t: TFunction): Group[] {
  const result = entities.reduce((groups, entityToGroup) => {
    if (permissions?.[entityToGroup.type.toLowerCase()]?.[entityToGroup.entity.slug]?.read.permission) {
      if (entityToGroup.entity.admin.group) {
        const existingGroup = groups.find((group) => group.label === entityToGroup.entity.admin.group);
        let matchedGroup: Group = existingGroup;
        if (!existingGroup) {
          matchedGroup = { label: entityToGroup.entity.admin.group, entities: [] };
          groups.push(matchedGroup);
        }

        matchedGroup.entities.push(entityToGroup);
      } else {
        const defaultGroup = groups.find((group) => group.label === t(entityToGroup.type));
        defaultGroup.entities.push(entityToGroup);
      }
    }

    return groups;
  }, [
    {
      label: t('general:collections'),
      entities: [],
    },
    {
      label: t('general:globals'),
      entities: [],
    },
  ]);

  return result.filter((group) => group.entities.length > 0);
}
