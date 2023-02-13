import { Value } from './types';

type RelationMap = {
  [relation: string]: unknown[]
}

type CreateRelationMap = (args: {
  hasMany: boolean
  relationTo: string | string[]
  value: Value | Value[] // really needs to be `ValueWithRelation`
}) => RelationMap;

export const createRelationMap: CreateRelationMap = ({
  hasMany,
  relationTo,
  value,
}) => {
  const hasMultipleRelations = Array.isArray(relationTo);
  let relationMap: RelationMap;
  if (Array.isArray(relationTo)) {
    relationMap = relationTo.reduce((map, current) => {
      return { ...map, [current]: [] };
    }, {});
  } else {
    relationMap = { [relationTo]: [] };
  }

  const add = (relation: string, id: unknown) => {
    if (((typeof id === 'string') || typeof id === 'number') && typeof relation === 'string') {
      relationMap[relation].push(id);
    }
  };

  if (hasMany && Array.isArray(value)) {
    value.forEach((val) => {
      if (hasMultipleRelations && typeof val === 'object' && 'relationTo' in val && 'value' in val) {
        add(val.relationTo, val.value);
      }

      if (!hasMultipleRelations && typeof relationTo === 'string') {
        add(relationTo, val);
      }
    });
  } else if (hasMultipleRelations && Array.isArray(relationTo)) {
    if (typeof value === 'object' && 'relationTo' in value && 'value' in value) {
      add(value.relationTo, value.value);
    }
  } else {
    add(relationTo, value);
  }

  return relationMap;
};
