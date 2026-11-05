import type { Column } from 'drizzle-orm'
import type { FlattenedField } from 'payload'

import { sql } from 'drizzle-orm'
import { describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter, DrizzleOperandTransformHandler } from '../types.js'

import { buildOperatorConstraint } from './buildOperatorConstraint.js'

const textField = { name: 'title', type: 'text' } as unknown as FlattenedField
const numberField = { name: 'age', type: 'number' } as unknown as FlattenedField

describe('buildOperatorConstraint', () => {
  it('calls the default operator unchanged when no handlers are configured', () => {
    const sentinel = sql`sentinel`
    const containsOperator = vi.fn().mockReturnValue(sentinel)
    const adapter = {
      operatorHandlers: [],
      operators: { contains: containsOperator },
    } as unknown as DrizzleAdapter
    const column = 'col' as unknown as Column

    const result = buildOperatorConstraint({
      adapter,
      column,
      field: textField,
      originalOperator: 'contains',
      path: 'title',
      resolvedOperator: 'contains',
      value: 'acido',
    })

    expect(containsOperator).toHaveBeenCalledWith(column, 'acido')
    expect(result).toBe(sentinel)
  })

  it('applies operand-transform handlers in configuration order before the default operator runs', () => {
    const calls: string[] = []
    const containsOperator = vi.fn(() => sql`result`)

    const handlerA: DrizzleOperandTransformHandler = {
      name: 'handler-a',
      operators: ['contains'],
      transformOperands: ({ column, value }) => {
        calls.push('a')
        return { column: `${column}-a` as unknown as Column, value: `${value}-a` }
      },
    }
    const handlerB: DrizzleOperandTransformHandler = {
      name: 'handler-b',
      operators: ['contains'],
      transformOperands: ({ column, value }) => {
        calls.push('b')
        return { column: `${column}-b` as unknown as Column, value: `${value}-b` }
      },
    }

    const adapter = {
      operatorHandlers: [handlerA, handlerB],
      operators: { contains: containsOperator },
    } as unknown as DrizzleAdapter

    buildOperatorConstraint({
      adapter,
      column: 'base-column' as unknown as Column,
      field: textField,
      originalOperator: 'contains',
      path: 'title',
      resolvedOperator: 'contains',
      value: 'acido',
    })

    expect(calls).toEqual(['a', 'b'])
    expect(containsOperator).toHaveBeenCalledWith('base-column-a-b', 'acido-a-b')
  })

  it('skips a handler whose operators list excludes the resolved operator', () => {
    const transformOperands = vi.fn(({ column, value }) => ({ column, value }))
    const adapter = {
      operatorHandlers: [{ name: 'like-only', operators: ['like'], transformOperands }],
      operators: { contains: vi.fn(() => sql`result`) },
    } as unknown as DrizzleAdapter

    buildOperatorConstraint({
      adapter,
      column: 'col' as unknown as Column,
      field: textField,
      originalOperator: 'contains',
      path: 'title',
      resolvedOperator: 'contains',
      value: 'acido',
    })

    expect(transformOperands).not.toHaveBeenCalled()
  })

  it("skips a handler whose fieldTypes excludes the field's type even when operators matches", () => {
    const transformOperands = vi.fn(({ column, value }) => ({ column, value }))
    const adapter = {
      operatorHandlers: [
        { name: 'text-only', operators: ['contains'], fieldTypes: ['text'], transformOperands },
      ],
      operators: { contains: vi.fn(() => sql`result`) },
    } as unknown as DrizzleAdapter

    buildOperatorConstraint({
      adapter,
      column: 'col' as unknown as Column,
      field: numberField,
      originalOperator: 'contains',
      path: 'age',
      resolvedOperator: 'contains',
      value: 5,
    })

    expect(transformOperands).not.toHaveBeenCalled()
  })

  it('runs a handler with no fieldTypes for every field type', () => {
    const transformOperands = vi.fn(({ column, value }) => ({ column, value }))
    const adapter = {
      operatorHandlers: [{ name: 'universal', operators: ['contains'], transformOperands }],
      operators: { contains: vi.fn(() => sql`result`) },
    } as unknown as DrizzleAdapter

    buildOperatorConstraint({
      adapter,
      column: 'col' as unknown as Column,
      field: numberField,
      originalOperator: 'contains',
      path: 'age',
      resolvedOperator: 'contains',
      value: 5,
    })

    expect(transformOperands).toHaveBeenCalled()
  })

  it('gives a single matching replacement handler the operands after every transform has run, and uses its result instead of the default operator', () => {
    const containsOperator = vi.fn()
    const sentinel = sql`replacement`
    const build = vi.fn().mockReturnValue(sentinel)
    const transformOperands = vi.fn(({ column, value }) => ({
      column: `${column}-t` as unknown as Column,
      value: `${value}-t`,
    }))

    const adapter = {
      operatorHandlers: [
        { name: 'transform', operators: ['contains'], transformOperands },
        { name: 'replace', operators: ['contains'], build },
      ],
      operators: { contains: containsOperator },
    } as unknown as DrizzleAdapter

    const result = buildOperatorConstraint({
      adapter,
      column: 'col' as unknown as Column,
      field: textField,
      originalOperator: 'contains',
      path: 'title',
      resolvedOperator: 'contains',
      value: 'acido',
    })

    expect(build).toHaveBeenCalledWith(
      expect.objectContaining({ column: 'col-t', value: 'acido-t' }),
    )
    expect(containsOperator).not.toHaveBeenCalled()
    expect(result).toBe(sentinel)
  })

  it('passes originalOperator, resolvedOperator, field, path, and locale to handlers', () => {
    let capturedContext: any
    const transformOperands = vi.fn((context) => {
      capturedContext = context
      return { column: context.column, value: context.value }
    })

    const adapter = {
      operatorHandlers: [{ name: 'observe', operators: ['like'], transformOperands }],
      operators: { like: vi.fn(() => sql`result`) },
    } as unknown as DrizzleAdapter

    buildOperatorConstraint({
      adapter,
      column: 'col' as unknown as Column,
      field: textField,
      locale: 'es',
      originalOperator: 'like',
      path: 'title',
      resolvedOperator: 'like',
      value: '%nino%',
    })

    expect(capturedContext).toMatchObject({
      field: textField,
      locale: 'es',
      originalOperator: 'like',
      path: 'title',
      resolvedOperator: 'like',
    })
  })

  it('wraps a handler error with the handler name, path, and resolved operator, retaining the original error as the cause', () => {
    const originalError = new Error('boom')
    const transformOperands = vi.fn(() => {
      throw originalError
    })

    const adapter = {
      operatorHandlers: [{ name: 'explode', operators: ['contains'], transformOperands }],
      operators: { contains: vi.fn() },
    } as unknown as DrizzleAdapter

    let thrown: unknown
    try {
      buildOperatorConstraint({
        adapter,
        column: 'col' as unknown as Column,
        field: textField,
        originalOperator: 'contains',
        path: 'title',
        resolvedOperator: 'contains',
        value: 'acido',
      })
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(Error)
    const error = thrown as Error
    expect(error.message).toContain('explode')
    expect(error.message).toContain('title')
    expect(error.message).toContain('contains')
    expect(error.cause).toBe(originalError)
  })

  it('throws a configuration error when a transform handler returns operands missing column or value, before any default operator or replacement runs', () => {
    const transformOperands = vi.fn().mockReturnValue({ column: 'only-column' })
    const containsOperator = vi.fn()
    const build = vi.fn()

    const adapter = {
      operatorHandlers: [
        { name: 'broken', operators: ['contains'], transformOperands },
        { name: 'replace', operators: ['contains'], build },
      ],
      operators: { contains: containsOperator },
    } as unknown as DrizzleAdapter

    expect(() =>
      buildOperatorConstraint({
        adapter,
        column: 'col' as unknown as Column,
        field: textField,
        originalOperator: 'contains',
        path: 'title',
        resolvedOperator: 'contains',
        value: 'acido',
      }),
    ).toThrow(/broken/)

    expect(containsOperator).not.toHaveBeenCalled()
    expect(build).not.toHaveBeenCalled()
  })
})
