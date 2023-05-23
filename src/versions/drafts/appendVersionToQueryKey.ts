import { Where } from '../../types';

export const appendVersionToQueryKey = (query: Where): Where => {
  return Object.entries(query).reduce((res, [key, val]) => {
    if (['and', 'or', 'AND', 'OR'].includes(key) && Array.isArray(val)) {
      return {
        ...res,
        [key.toLowerCase()]: val.map((subQuery) => appendVersionToQueryKey(subQuery)),
      };
    }

    if (key !== 'id') {
      return {
        ...res,
        [`version.${key}`]: val,
      };
    }

    return {
      ...res,
      _id: val,
    };
  }, {});
};
