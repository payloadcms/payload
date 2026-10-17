import { describe, expect, it } from 'vitest'

import { buildMultiCollectionJoinMatch } from './buildMultiCollectionJoinMatch.js'

// Minimal evaluator for the aggregation operators this helper emits.
// `$$root_id_` is the joined document's id; `$<field>` reads the stored value.
const evaluate = (expr: any, doc: Record<string, unknown>, rootId: unknown): unknown => {
  const resolve = (operand: unknown): unknown => {
    if (operand === '$$root_id_') {
      return rootId
    }
    if (typeof operand === 'string' && operand.startsWith('$')) {
      return doc[operand.slice(1)]
    }
    return operand
  }

  if (expr.$eq) {
    const [a, b] = expr.$eq.map(resolve)
    return JSON.stringify(a) === JSON.stringify(b)
  }
  if (expr.$in) {
    const [needle, haystack] = expr.$in.map(resolve)
    return (
      Array.isArray(haystack) &&
      haystack.some((item) => JSON.stringify(item) === JSON.stringify(needle))
    )
  }
  if (expr.$cond) {
    const isArrayOperand = expr.$cond.if?.$isArray
    const condition =
      typeof isArrayOperand === 'string' ? Array.isArray(resolve(isArrayOperand)) : false
    return evaluate(condition ? expr.$cond.then : expr.$cond.else, doc, rootId)
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
