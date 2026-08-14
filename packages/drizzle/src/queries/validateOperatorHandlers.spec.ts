import { describe, expect, it } from 'vitest'

import type { DrizzleOperatorHandler } from '../types.js'

import { validateOperatorHandlers } from './validateOperatorHandlers.js'

const transformHandler = (
  overrides: Partial<DrizzleOperatorHandler> = {},
): DrizzleOperatorHandler =>
  ({
    name: 'transform',
    operators: ['contains'],
    transformOperands: ({ column, value }) => ({ column, value }),
    ...overrides,
  }) as DrizzleOperatorHandler

const replacementHandler = (
  overrides: Partial<DrizzleOperatorHandler> = {},
): DrizzleOperatorHandler =>
  ({
    name: 'replace',
    operators: ['contains'],
    build: () => null as any,
    ...overrides,
  }) as DrizzleOperatorHandler

describe('validateOperatorHandlers', () => {
  it('does not throw when zero handlers are configured', () => {
    expect(() => validateOperatorHandlers([])).not.toThrow()
  })

  it('does not throw for any number of non-conflicting operand-transform handlers', () => {
    expect(() =>
      validateOperatorHandlers([
        transformHandler({ name: 'a' }),
        transformHandler({ name: 'b' }),
        transformHandler({ name: 'c' }),
      ]),
    ).not.toThrow()
  })

  it('throws when two build handlers list the same resolved operator, naming both handlers and the operator', () => {
    expect(() =>
      validateOperatorHandlers([
        replacementHandler({ name: 'handler-a', operators: ['contains'] }),
        replacementHandler({ name: 'handler-b', operators: ['contains'] }),
      ]),
    ).toThrow(/handler-a/)

    expect(() =>
      validateOperatorHandlers([
        replacementHandler({ name: 'handler-a', operators: ['contains'] }),
        replacementHandler({ name: 'handler-b', operators: ['contains'] }),
      ]),
    ).toThrow(/handler-b/)

    expect(() =>
      validateOperatorHandlers([
        replacementHandler({ name: 'handler-a', operators: ['contains'] }),
        replacementHandler({ name: 'handler-b', operators: ['contains'] }),
      ]),
    ).toThrow(/contains/)
  })

  it('does not throw when two build handlers target the same operator but declare disjoint fieldTypes', () => {
    expect(() =>
      validateOperatorHandlers([
        replacementHandler({ name: 'text', operators: ['contains'], fieldTypes: ['text'] }),
        replacementHandler({ name: 'number', operators: ['contains'], fieldTypes: ['number'] }),
      ]),
    ).not.toThrow()
  })

  it('throws when two build handlers target the same operator and at least one declares no fieldTypes', () => {
    expect(() =>
      validateOperatorHandlers([
        replacementHandler({ name: 'unrestricted', operators: ['contains'] }),
        replacementHandler({ name: 'text', operators: ['contains'], fieldTypes: ['text'] }),
      ]),
    ).toThrow()
  })

  it('throws when a handler object defines both build and transformOperands', () => {
    const malformed = {
      name: 'malformed',
      operators: ['contains'],
      build: () => null as any,
      transformOperands: ({ column, value }: any) => ({ column, value }),
    } as unknown as DrizzleOperatorHandler

    expect(() => validateOperatorHandlers([malformed])).toThrow(/malformed/)
  })
})
