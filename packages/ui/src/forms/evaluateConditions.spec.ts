import { describe, expect, it } from 'vitest'

import { evaluateConditions } from './evaluateConditions.js'

describe('evaluateConditions', () => {
  it('returns true for fields with no condition', () => {
    const result = evaluateConditions({
      context: { blockData: undefined, operation: 'update', user: null },
      data: { title: 'x' },
      fields: [{ condition: undefined, path: 'posts.title' }],
    })
    expect(result.get('posts.title')).toBe(true)
  })

  it('runs a sync condition and forwards data', () => {
    let received: unknown
    const result = evaluateConditions({
      context: { blockData: undefined, operation: 'update', user: null },
      data: { kind: 'A' },
      fields: [
        {
          condition: (data) => {
            received = data
            return (data as { kind: string }).kind === 'A'
          },
          path: 'posts.subtitle',
        },
      ],
    })
    expect(result.get('posts.subtitle')).toBe(true)
    expect(received).toEqual({ kind: 'A' })
  })

  it('passes siblingData and context to the condition', () => {
    const calls: Array<unknown[]> = []
    evaluateConditions({
      context: { blockData: { kind: 'block' }, operation: 'create', user: { id: 1 } },
      data: { foo: 1 },
      fields: [
        {
          condition: (...args) => {
            calls.push(args)
            return true
          },
          path: 'posts.x',
          siblingData: { sibling: 2 },
        },
      ],
    })
    expect(calls).toHaveLength(1)
    expect(calls[0]![0]).toEqual({ foo: 1 })
    expect(calls[0]![1]).toEqual({ sibling: 2 })
    expect(calls[0]![2]).toMatchObject({
      blockData: { kind: 'block' },
      operation: 'create',
      user: { id: 1 },
    })
  })

  it('throws if a condition returns a Promise', () => {
    expect(() =>
      evaluateConditions({
        context: { blockData: undefined, operation: 'update', user: null },
        data: {},
        fields: [
          { condition: (() => Promise.resolve(true)) as unknown as () => boolean, path: 'posts.x' },
        ],
      }),
    ).toThrowError(/must be synchronous/)
  })

  it('coerces a truthy non-boolean return value to true', () => {
    const result = evaluateConditions({
      context: { blockData: undefined, operation: 'update', user: null },
      data: {},
      fields: [{ condition: () => 'truthy' as unknown as boolean, path: 'posts.x' }],
    })
    expect(result.get('posts.x')).toBe(true)
  })

  it('respects parent visibility — a hidden parent hides children', () => {
    const result = evaluateConditions({
      context: { blockData: undefined, operation: 'update', user: null },
      data: {},
      fields: [
        { condition: () => false, path: 'posts.parent' },
        { condition: () => true, path: 'posts.parent.child' },
      ],
    })
    expect(result.get('posts.parent')).toBe(false)
    expect(result.get('posts.parent.child')).toBe(false)
  })

  it('handles deep nesting where any ancestor being false hides descendants', () => {
    const result = evaluateConditions({
      context: { blockData: undefined, operation: 'update', user: null },
      data: {},
      fields: [
        { condition: () => true, path: 'posts.a' },
        { condition: () => false, path: 'posts.a.b' },
        { condition: () => true, path: 'posts.a.b.c' },
      ],
    })
    expect(result.get('posts.a')).toBe(true)
    expect(result.get('posts.a.b')).toBe(false)
    expect(result.get('posts.a.b.c')).toBe(false)
  })

  it('processes ancestors before descendants regardless of input order', () => {
    const result = evaluateConditions({
      context: { blockData: undefined, operation: 'update', user: null },
      data: {},
      fields: [
        { condition: () => true, path: 'posts.parent.child' },
        { condition: () => false, path: 'posts.parent' },
      ],
    })
    expect(result.get('posts.parent.child')).toBe(false)
  })
})
