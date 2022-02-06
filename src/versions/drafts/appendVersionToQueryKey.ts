import { Where } from '../../types';

export const appendVersionToQueryKey = (query: Where): Where => {
  return Object.entries(query).reduce((res, [key, val]) => {
    if (['and', 'or'].includes(key) && Array.isArray(val)) {
      return {
        ...res,
        [key]: val.map((subQuery) => appendVersionToQueryKey(subQuery)),
      };
    }

    return {
      ...res,
      [`version.${key}`]: val,
    };
  }, {});
};
