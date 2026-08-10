import { describe, expect, it } from 'vitest'

import type { PostgresOperatorHandler } from '../types.js'

import { validatePostgresOperatorHandlers } from './validatePostgresOperatorHandlers.js'

const transformHandler = (
  overrides: Partial<PostgresOperatorHandler> = {},
): PostgresOperatorHandler =>
  ({
    name: 'transform',
    operators: ['contains'],
    transformOperands: ({ column, value }) => ({ column, value }),
    ...overrides,
  }) as PostgresOperatorHandler

const replacementHandler = (
  overrides: Partial<PostgresOperatorHandler> = {},
): PostgresOperatorHandler =>
  ({
    name: 'replace',
    operators: ['contains'],
    build: () => null as any,
    ...overrides,
  }) as PostgresOperatorHandler

describe('validatePostgresOperatorHandlers', () => {
  it('does not throw for a handler with no requiredExtensions, regardless of configured extensions', () => {
    expect(() =>
      validatePostgresOperatorHandlers({
        extensions: {},
        operatorHandlers: [transformHandler({ requiredExtensions: undefined })],
      }),
    ).not.toThrow()
  })

  it('does not throw for a handler requiring an extension present in the adapter extensions', () => {
    expect(() =>
      validatePostgresOperatorHandlers({
        extensions: { unaccent: true },
        operatorHandlers: [transformHandler({ requiredExtensions: ['unaccent'] })],
      }),
    ).not.toThrow()
  })

  it('throws for a handler requiring an extension absent from the adapter extensions, naming the handler and the missing extension', () => {
    expect(() =>
      validatePostgresOperatorHandlers({
        extensions: {},
        operatorHandlers: [
          transformHandler({ name: 'postgres-unaccent', requiredExtensions: ['unaccent'] }),
        ],
      }),
    ).toThrow(/postgres-unaccent/)

    expect(() =>
      validatePostgresOperatorHandlers({
        extensions: {},
        operatorHandlers: [
          transformHandler({ name: 'postgres-unaccent', requiredExtensions: ['unaccent'] }),
        ],
      }),
    ).toThrow(/unaccent/)
  })

  it('still throws for a replacement conflict even when extension requirements are satisfied, delegating to validateOperatorHandlers', () => {
    expect(() =>
      validatePostgresOperatorHandlers({
        extensions: { unaccent: true },
        operatorHandlers: [
          replacementHandler({
            name: 'handler-a',
            operators: ['contains'],
            requiredExtensions: ['unaccent'],
          }),
          replacementHandler({
            name: 'handler-b',
            operators: ['contains'],
            requiredExtensions: ['unaccent'],
          }),
        ],
      }),
    ).toThrow(/handler-a/)
  })
})
