import { hasWhereAccessResult } from '../auth.js';
import { Where } from '../types.js';

export const combineQueries = (where: Where, access: Where | boolean): Where => {
  if (!where && !access) return {};

  const result: Where = {
    and: [],
  };

  if (where) result.and.push(where);
  if (hasWhereAccessResult(access)) result.and.push(access);

  return result;
};
