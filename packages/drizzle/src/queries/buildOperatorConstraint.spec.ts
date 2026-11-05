import type { Column } from 'drizzle-orm'
import type { FlattenedField } from 'payload'
import type { ResolvedDateFilterTarget } from 'payload/shared'

import { sql } from 'drizzle-orm'
import { describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter, DrizzleOperandTransformHandler } from '../types.js'

import { createJSONQuery } from '../postgres/createJSONQuery/index.js'
import { buildDateComparisonConstraint, getDateOnlyJSONPaths } from './buildDateFilterConstraint.js'
import { buildOperatorConstraint } from './buildOperatorConstraint.js'

const textField = { name: 'title', type: 'text' } as unknown as FlattenedField
const numberField = { name: 'age', type: 'number' } as unknown as FlattenedField
const dateOnlyField = {
  name: 'publishedOn',
  timezone: { defaultTimezone: 'Europe/London' },
  type: 'date',
} as unknown as FlattenedField
const datePlan = {
  input: {
    kind: 'calendarDay',
    serialized: '2026-03-29',
    value: { day: 29, month: 3, year: 2026 },
  },
  operator: 'equals',
  pickerAppearance: 'default',
  targets: [{ field: dateOnlyField, lineage: [] }],
  timezone: 'Europe/London',
} as const

describe('buildOperatorConstraint', () => {
  it('does not infer calendar-day semantics while building an ordinary operator', () => {
    const equals = vi.fn(() => sql`equals`)
    const adapter = {
      operatorHandlers: [],
      operators: {
        equals,
      },
      payload: { config: {} },
    } as unknown as DrizzleAdapter
    const column = 'published_on' as unknown as Column

    const result = buildOperatorConstraint({
      adapter,
      column,
      field: dateOnlyField,
      originalOperator: 'equals',
      path: 'publishedOn',
      resolvedOperator: 'equals',
      value: '2026-03-29',
    })

    expect(equals).toHaveBeenCalledOnce()
    expect(equals).toHaveBeenCalledWith(column, '2026-03-29')
    expect(result).toBeDefined()
  })

  it('builds calendar-day equality only through the resolved date plan', () => {
    const greaterThanEqual = vi.fn(() => sql`after-start`)
    const lessThan = vi.fn(() => sql`before-end`)
    const adapter = {
      operatorHandlers: [],
      operators: { greater_than_equal: greaterThanEqual, less_than: lessThan },
    } as unknown as DrizzleAdapter
    const column = 'published_on' as unknown as Column

    const result = buildDateComparisonConstraint({
      adapter,
      column,
      path: 'publishedOn',
      plan: datePlan,
      target: datePlan.targets[0],
    })

    expect(greaterThanEqual).toHaveBeenCalledWith(column, '2026-03-29T00:00:00.000Z')
    expect(lessThan).toHaveBeenCalledWith(column, '2026-03-29T23:00:00.000Z')
    expect(result).toBeDefined()
  })

  it('keeps a replacement handler authoritative for date-only equality', () => {
    const sentinel = sql`replacement`
    const build = vi.fn(() => sentinel)
    const equalsOperator = vi.fn()
    const adapter = {
      operatorHandlers: [
        { build, fieldTypes: ['date'], name: 'custom-date-equals', operators: ['equals'] },
      ],
      operators: { equals: equalsOperator },
      payload: { config: {} },
    } as unknown as DrizzleAdapter

    const result = buildOperatorConstraint({
      adapter,
      column: 'published_on' as unknown as Column,
      field: dateOnlyField,
      originalOperator: 'equals',
      path: 'publishedOn',
      resolvedOperator: 'equals',
      value: '2026-03-29',
    })

    expect(build).toHaveBeenCalledWith(expect.objectContaining({ value: '2026-03-29' }))
    expect(equalsOperator).not.toHaveBeenCalled()
    expect(result).toBe(sentinel)
  })

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

describe('date-only JSON constraints', () => {
  it('marks localized nested arrays at their stored JSON path', () => {
    expect(
      getDateOnlyJSONPaths({
        pathSegments: ['content', 'rows', 'publishedOn'],
        target: {
          field: dateOnlyField as ResolvedDateFilterTarget['field'],
          lineage: [
            { isLocalized: false, name: 'content', type: 'blocks' },
            { isLocalized: true, locale: 'en', name: 'rows', type: 'array' },
            { isLocalized: false, name: 'publishedOn', type: 'date' },
          ],
        },
      }),
    ).toEqual({
      pathSegments: ['content', 'rows', 'en', 'publishedOn'],
      repeatedPaths: ['rows.en'],
    })
  })

  it('binds both day boundaries to the same JSON array value', () => {
    const query = createJSONQuery({
      column: 'content',
      operator: 'date_equals',
      pathSegments: ['content', 'publishedOn'],
      treatRootAsArray: true,
      value: ['2026-03-29T00:00:00.000Z', '2026-03-29T23:00:00.000Z'],
    })

    expect(query).toContain(`jsonb_path_query(content, '$[*].publishedOn[*]')`)
    expect(query).toContain(`>= '2026-03-29T00:00:00.000Z'::timestamptz`)
    expect(query).toContain(`< '2026-03-29T23:00:00.000Z'::timestamptz`)
  })

  it('negates the whole JSON day predicate for not_equals', () => {
    const query = createJSONQuery({
      column: 'content',
      operator: 'date_not_equals',
      pathSegments: ['content', 'publishedOn'],
      treatRootAsArray: true,
      value: ['2026-03-29T00:00:00.000Z', '2026-03-29T23:00:00.000Z'],
    })

    expect(query).toContain(`jsonb_path_query(content, '$[*].publishedOn[*]')`)
    expect(query).toMatch(/\) IS NOT TRUE$/)
  })

  it('builds paths relative to a JSON blocks column nested in a group', () => {
    expect(
      getDateOnlyJSONPaths({
        pathSegments: ['content', 'publishedOn'],
        target: {
          field: dateOnlyField as ResolvedDateFilterTarget['field'],
          lineage: [
            { isLocalized: false, name: 'group', type: 'group' },
            { isLocalized: false, name: 'content', type: 'blocks' },
            { isLocalized: false, name: 'publishedOn', type: 'date' },
          ],
        },
      }),
    ).toEqual({
      pathSegments: ['content', 'publishedOn'],
      repeatedPaths: [],
    })
  })
})
