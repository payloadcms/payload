export type OperatorMapKey = keyof typeof operatorMap

export const operatorMap = {
  all: '$all',
  equals: '$eq',
  exists: '$exists',
  greater_than: '$gt',
  greater_than_equal: '$gte',
  in: '$in',
  intersects: '$geoIntersects',
  less_than: '$lt',
  less_than_equal: '$lte',
  near: '$near',
  not_equals: '$ne',
  not_in: '$nin',
  within: '$geoWithin',
}
