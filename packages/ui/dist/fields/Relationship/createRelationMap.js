'use client';

export const createRelationMap = ({
  hasMany,
  relationTo,
  value
}) => {
  const relationMap = relationTo.reduce((map, current) => {
    return {
      ...map,
      [current]: []
    };
  }, {});
  if (value === null) {
    return relationMap;
  }
  if (value) {
    const add = (relation, id) => {
      if ((typeof id === 'string' || typeof id === 'number') && typeof relation === 'string') {
        if (relationMap[relation]) {
          relationMap[relation].push(id);
        } else {
          relationMap[relation] = [id];
        }
      }
    };
    if (hasMany === true) {
      value.forEach(val => {
        if (val) {
          add(val.relationTo, val.value);
        }
      });
    } else {
      add(value.relationTo, value.value);
    }
  }
  return relationMap;
};
//# sourceMappingURL=createRelationMap.js.map