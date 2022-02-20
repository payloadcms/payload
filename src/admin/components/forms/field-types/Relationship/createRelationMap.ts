import { Value } from '../../../elements/ReactSelect/types';
import { ValueWithRelation } from './types';

type RelationMap = {
  [relation: string]: unknown[]
}

type CreateRelationMap = (args: {
  hasMany: boolean
  relationTo: string | string[]
  value: unknown
}) => RelationMap;

export const createRelationMap: CreateRelationMap = ({
  hasMany,
  relationTo,
  value,
}) => {
  const hasMultipleRelations = Array.isArray(relationTo);
  const relationMap: RelationMap = {};

  const add = (relation: string, id: unknown) => {
    if (typeof relationMap[relation] === 'undefined') relationMap[relation] = [];

    if (id !== 'null' && id !== null) {
      relationMap[relation].push(id);
    }
  };

  if (hasMany && Array.isArray(value)) {
    value.forEach((val) => {
      if (hasMultipleRelations) {
        add(val.relationTo, val.value);
      } else {
        add(relationTo, val);
      }
    });
  } else if (hasMultipleRelations) {
    const valueWithRelation = value as ValueWithRelation;
    add(valueWithRelation.relationTo, valueWithRelation.value);
  } else {
    add(relationTo, value);
  }

  return relationMap;
};
