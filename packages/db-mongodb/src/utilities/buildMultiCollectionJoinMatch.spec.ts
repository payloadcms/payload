import { describe, expect, it } from 'vitest'

import { buildMultiCollectionJoinMatch } from './buildMultiCollectionJoinMatch.js'

// Minimal evaluator for the aggregation operators this helper emits.
// `$$root_id_` is the joined document's id; `$<field>` reads the stored value;
// dotted paths (`$field.value`, `$$var.value`) traverse objects.
const evaluate = (
  expr: any,
  doc: Record<string, unknown>,
  rootId: unknown,
  vars: Record<string, unknown> = {},
): unknown => {
  const resolve = (operand: unknown, scope: Record<string, unknown> = vars): unknown => {
    if (typeof operand !== 'string' || !operand.startsWith('$')) {
      return operand
    }
    const [head, ...tail] = operand.split('.')
    let value: unknown
    if (head === '$$root_id_') {
      value = rootId
    } else if (head.startsWith('$$')) {
      value = scope[head.slice(2)]
    } else {
      value = doc[head.slice(1)]
    }
    for (const segment of tail) {
      value = (value as Record<string, unknown> | null | undefined)?.[segment]
    }
    return value
  }

  const resolveOperand = (operand: unknown, scope: Record<string, unknown> = vars): unknown => {
    if (operand !== null && typeof operand === 'object' && !Array.isArray(operand)) {
      return evaluate(operand, doc, rootId, scope)
    }
    return resolve(operand, scope)
  }

  if (expr.$eq) {
    const [a, b] = expr.$eq.map((operand: unknown) => resolveOperand(operand))
    return JSON.stringify(a) === JSON.stringify(b)
  }
  if (expr.$and) {
    return expr.$and.every((operand: unknown) => resolveOperand(operand) === true)
  }
  if (expr.$in) {
    const [needle, haystack] = expr.$in.map((operand: unknown) => resolveOperand(operand))
    return (
      Array.isArray(haystack) &&
      haystack.some((item) => JSON.stringify(item) === JSON.stringify(needle))
    )
  }
  if (expr.$map) {
    const { input, as, in: mapExpr } = expr.$map
    const arr = resolve(input)
    if (!Array.isArray(arr)) {
      return []
    }
    return arr.map((item) => resolveOperand(mapExpr, { ...vars, [as]: item }))
  }
  if (expr.$cond) {
    const isArrayOperand = expr.$cond.if?.$isArray
    const condition =
      typeof isArrayOperand === 'string' ? Array.isArray(resolve(isArrayOperand)) : false
    return evaluate(condition ? expr.$cond.then : expr.$cond.else, doc, rootId, vars)
  }
  throw new Error(`unsupported operator in ${JSON.stringify(expr)}`)
}

describe('buildMultiCollectionJoinMatch', () => {
  it('should match when the stored value is an array containing the id', () => {
    const expr = buildMultiCollectionJoinMatch('_h_tags')

    expect(evaluate(expr, { _h_tags: ['news-id', 'sport-id'] }, 'news-id')).toBe(true)
  })

  it('should not match when the stored array does not contain the id', () => {
    const expr = buildMultiCollectionJoinMatch('_h_tags')

    expect(evaluate(expr, { _h_tags: ['sport-id'] }, 'news-id')).toBe(false)
  })

  it('should keep matching single scalar values', () => {
    const expr = buildMultiCollectionJoinMatch('_h_folder')

    expect(evaluate(expr, { _h_folder: 'folder-id' }, 'folder-id')).toBe(true)
    expect(evaluate(expr, { _h_folder: 'other-id' }, 'folder-id')).toBe(false)
  })

  it('should match an empty array only when nothing is expected', () => {
    const expr = buildMultiCollectionJoinMatch('_h_tags')

    expect(evaluate(expr, { _h_tags: [] }, 'news-id')).toBe(false)
  })

  it('should branch on the stored value shape', () => {
    const expr = buildMultiCollectionJoinMatch('_h_tags')

    expect(expr).toEqual({
      $cond: {
        if: { $isArray: '$_h_tags' },
        then: { $in: ['$$root_id_', '$_h_tags'] },
        else: { $eq: ['$_h_tags', '$$root_id_'] },
      },
    })
  })
})

describe('previous behavior (regression)', () => {
  it('should show the old $eq-only match fails for arrays', () => {
    // The expression buildJoinAggregation used before this fix
    const oldExpr = { $eq: ['$_h_tags', '$$root_id_'] }

    expect(evaluate(oldExpr, { _h_tags: ['news-id', 'sport-id'] }, 'news-id')).toBe(false)
  })
})

describe('polymorphic target fields', () => {
  it('should match scalar polymorphic values by their .value', () => {
    const expr = buildMultiCollectionJoinMatch('_h_tags', true, 'posts')

    expect(
      evaluate(expr, { _h_tags: { relationTo: 'posts', value: 'news-id' } }, 'news-id'),
    ).toBe(true)
    expect(
      evaluate(expr, { _h_tags: { relationTo: 'posts', value: 'other-id' } }, 'news-id'),
    ).toBe(false)
  })

  it('should not match a colliding id that references a different collection (scalar)', () => {
    const expr = buildMultiCollectionJoinMatch('_h_tags', true, 'posts')

    // Same id value, but the stored reference points at another collection:
    // without the relationTo check this would be a false join.
    expect(
      evaluate(expr, { _h_tags: { relationTo: 'authors', value: 'news-id' } }, 'news-id'),
    ).toBe(false)
  })

  it('should match polymorphic arrays by member .value', () => {
    const expr = buildMultiCollectionJoinMatch('_h_tags', true, 'posts')

    expect(
      evaluate(
        expr,
        {
          _h_tags: [
            { relationTo: 'posts', value: 'news-id' },
            { relationTo: 'posts', value: 'sport-id' },
          ],
        },
        'news-id',
      ),
    ).toBe(true)
    expect(
      evaluate(expr, { _h_tags: [{ relationTo: 'posts', value: 'sport-id' }] }, 'news-id'),
    ).toBe(false)
  })

  it('should not match a colliding id that references a different collection (array)', () => {
    const expr = buildMultiCollectionJoinMatch('_h_tags', true, 'posts')

    expect(
      evaluate(expr, { _h_tags: [{ relationTo: 'authors', value: 'news-id' }] }, 'news-id'),
    ).toBe(false)
  })

  it('should not match raw ids in polymorphic mode', () => {
    const expr = buildMultiCollectionJoinMatch('_h_tags', true, 'posts')

    // Guards against passing the flag for non-polymorphic fields: raw ids
    // are objects-free, so `.value` is undefined and nothing matches.
    expect(evaluate(expr, { _h_tags: ['news-id'] }, 'news-id')).toBe(false)
    expect(evaluate(expr, { _h_tags: 'news-id' }, 'news-id')).toBe(false)
  })

  it('should pin the polymorphic expression shape', () => {
    const expr = buildMultiCollectionJoinMatch('_h_tags', true, 'posts')

    expect(expr).toEqual({
      $cond: {
        if: { $isArray: '$_h_tags' },
        then: {
          $in: [
            true,
            {
              $map: {
                input: '$_h_tags',
                as: 'ref',
                in: {
                  $and: [
                    { $eq: ['$$ref.value', '$$root_id_'] },
                    { $eq: ['$$ref.relationTo', 'posts'] },
                  ],
                },
              },
            },
          ],
        },
        else: {
          $and: [
            { $eq: ['$_h_tags.value', '$$root_id_'] },
            { $eq: ['$_h_tags.relationTo', 'posts'] },
          ],
        },
      },
    })
  })
})
