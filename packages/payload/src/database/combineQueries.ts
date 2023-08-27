import { hasWhereAccessResult } from '../auth/types.js';
import { Where } from '../types/index.js';

export const combineQueries = (where: Where, access: Where | boolean): Where => {
  if (!where && !access) return {};

  const result: Where = {
    and: [],
  };

  if (where) result.and.push(where);
  if (hasWhereAccessResult(access)) result.and.push(access);

  return result;
};
