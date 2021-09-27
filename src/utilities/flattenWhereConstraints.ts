import { WhereField } from '../types';

const flattenWhereConstraints = (query): WhereField[] => {
  if (!query.where && !query.and && !query.or) {
    return Object.keys(query).map((key) => query[key]);
  }
  if (query.where) {
    const whereResult = flattenWhereConstraints(query.where);
    return Object.keys(whereResult).map((key) => whereResult[key]);
  }
  const nested = [...query.or || [], ...query.and || []];
  if (nested.length > 0) {
    return nested.flatMap((nest) => flattenWhereConstraints(nest));
  }
  return query;
};

export default flattenWhereConstraints;
