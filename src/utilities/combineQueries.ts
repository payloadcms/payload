import { Where } from '../types';

export const combineQueries = (where: Where, access: Where): Where => {
  if (!where && !access) return {};

  const result: Where = {
    and: [],
  };

  if (where) result.and.push(where);
  if (access) result.and.push(access);

  return result;
};
