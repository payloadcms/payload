import type { Field } from 'payload'

import { describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { sanitizeQueryValue } from './sanitizeQueryValue.js'

const createAdapter = (idType: DrizzleAdapter['idType'] = 'serial') =>
  ({
    idType,
    payload: {
      collections: {
        posts: {
          config: {
            slug: 'posts',
          },
        },
      },
    },
  }) as unknown as DrizzleAdapter

const parentField = {
  name: 'parent',
  relationTo: 'posts',
  type: 'relationship',
} as Field

const sanitizeIn = (val: unknown[]) =>
  sanitizeQueryValue({
    adapter: createAdapter(),
    field: parentField,
    isUUID: false,
    operator: 'in',
    relationOrPath: 'parent',
    val,
  })

describe('sanitizeQueryValue', () => {
  it('should bind each numeric id once for in filters', () => {
    // Regression test for https://github.com/payloadcms/payload/issues/18251 -
    // every id used to be expanded into both of its id-type spellings (number
    // and string) and bound twice, halving e.g. Cloudflare D1's 100-variable
    // limit (D1_ERROR: too many SQL variables at just 50 ids).
    expect(sanitizeIn([1, 2, 3]).value).toEqual([1, 2, 3])
  })

  it('should bind each string id once for in filters', () => {
    expect(sanitizeIn(['1', '2']).value).toEqual([1, 2])
  })

  it('should dedupe ids that are duplicated in the input', () => {
    expect(sanitizeIn([1, 1, 2]).value).toEqual([1, 2])
  })

  it('should keep a single id as a single bound value', () => {
    expect(sanitizeIn([42]).value).toEqual([42])
  })
})
