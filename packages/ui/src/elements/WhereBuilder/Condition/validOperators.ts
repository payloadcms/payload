import type { Operator } from 'payload'

export const operatorValueTypes: Record<Operator, 'any' | 'boolean' | 'number' | 'string'> = {
  all: 'any',
  contains: 'string',
  equals: 'any',
  exists: 'boolean',
  greater_than: 'number',
  greater_than_equal: 'number',
  in: 'any',
  intersects: 'any',
  less_than: 'number',
  less_than_equal: 'number',
  like: 'string',
  near: 'any',
  not_equals: 'any',
  not_in: 'any',
  within: 'any',
}
