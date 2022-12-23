export const operatorMap = {
  greater_than_equal: '$gte',
  less_than_equal: '$lte',
  less_than: '$lt',
  greater_than: '$gt',
  in: '$in',
  all: '$all',
  not_in: '$nin',
  not_equals: '$ne',
  exists: '$exists',
  equals: '$eq',
  near: '$near',
  every: 'NOT FALSEY', // just place holder value so not falsey
};

export const inverseOperatorMap = {
  greater_than_equal: 'less_than',
  less_than_equal: 'greater_than',
  less_than: 'greater_than_equal',
  greater_than: 'less_than_equal',
  in: 'not_in',
  not_in: 'in',
  not_equals: 'equals',
  equals: 'not_equals',
};
