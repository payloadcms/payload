import type { Operator } from 'payload'

export const operatorValueTypes: Record<Operator, 'any' | 'boolean' | 'object' | 'string'> = {
  all: 'any',
  contains: 'string',
  equals: 'any',
  exists: 'boolean',
  greater_than: 'object',
  greater_than_equal: 'object',
  in: 'any',
  intersects: 'any',
  less_than: 'object',
  less_than_equal: 'object',
  like: 'string',
  near: 'any',
  not_equals: 'any',
  not_in: 'any',
  not_like: 'string',
  within: 'any',
}
