import { describe, expect, it } from 'vitest'

import { sanitizeJoinParams } from './sanitizeJoinParams.js'

describe('sanitizeJoinParams', () => {
  it('should disable every join when passed the string "false"', () => {
    // Over REST the query string makes `?joins=false` the string 'false', not a boolean.
    expect(sanitizeJoinParams('false' as never)).toBe(false)
  })

  it('should disable every join when passed the boolean false', () => {
    expect(sanitizeJoinParams(false)).toBe(false)
  })

  it('should not build a join query out of the characters of "false"', () => {
    // `Object.keys('false')` is ['0','1','2','3','4'], so iterating the string produced
    // a join query keyed by character index that matched no field and disabled nothing.
    const result = sanitizeJoinParams('false' as never)

    expect(result).not.toHaveProperty('0')
    expect(result).not.toHaveProperty('1')
  })

  it('should still disable a single join field addressed by name', () => {
    expect(sanitizeJoinParams({ relatedItems: 'false' as never })).toEqual({
      relatedItems: false,
    })
    expect(sanitizeJoinParams({ relatedItems: false })).toEqual({
      relatedItems: false,
    })
  })

  it('should coerce the per-field options it is given', () => {
    expect(
      sanitizeJoinParams({
        relatedItems: {
          count: 'true',
          limit: '10',
          page: '2',
          sort: '-createdAt',
          where: { title: { equals: 'hello' } },
        },
      } as never),
    ).toEqual({
      relatedItems: {
        count: true,
        limit: 10,
        page: 2,
        sort: '-createdAt',
        where: { title: { equals: 'hello' } },
      },
    })
  })

  it('should return an empty join query when given nothing', () => {
    expect(sanitizeJoinParams()).toEqual({})
  })
})
