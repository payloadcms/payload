import { describe, expect, it, vi } from 'vitest'

import type { PostgresOperatorHandler } from '../types.js'

import { assertOperatorHandlerExtensionsInstalled } from './assertOperatorHandlerExtensionsInstalled.js'

const transformHandler = (
  overrides: Partial<PostgresOperatorHandler> = {},
): PostgresOperatorHandler =>
  ({
    name: 'transform',
    operators: ['contains'],
    transformOperands: ({ column, value }) => ({ column, value }),
    ...overrides,
  }) as PostgresOperatorHandler

const drizzleWithInstalledExtensions = (installedExtensions: string[]) => ({
  execute: vi.fn().mockResolvedValue({
    rows: installedExtensions.map((extname) => ({ extname })),
  }),
})

describe('assertOperatorHandlerExtensionsInstalled', () => {
  it('does not query the database when no handler declares requiredExtensions', async () => {
    const drizzle = drizzleWithInstalledExtensions([])

    await expect(
      assertOperatorHandlerExtensionsInstalled({
        drizzle: drizzle as any,
        operatorHandlers: [transformHandler({ requiredExtensions: undefined })],
      }),
    ).resolves.toBeUndefined()

    expect(drizzle.execute).not.toHaveBeenCalled()
  })

  it('does not throw for a handler requiring an extension installed in the database', async () => {
    const drizzle = drizzleWithInstalledExtensions(['unaccent'])

    await expect(
      assertOperatorHandlerExtensionsInstalled({
        drizzle: drizzle as any,
        operatorHandlers: [transformHandler({ requiredExtensions: ['unaccent'] })],
      }),
    ).resolves.toBeUndefined()
  })

  it('throws for a handler requiring an extension absent from the database, naming the handler and the missing extension', async () => {
    const drizzle = drizzleWithInstalledExtensions([])

    await expect(
      assertOperatorHandlerExtensionsInstalled({
        drizzle: drizzle as any,
        operatorHandlers: [
          transformHandler({ name: 'postgres-unaccent', requiredExtensions: ['unaccent'] }),
        ],
      }),
    ).rejects.toThrow(/postgres-unaccent/)

    await expect(
      assertOperatorHandlerExtensionsInstalled({
        drizzle: drizzle as any,
        operatorHandlers: [
          transformHandler({ name: 'postgres-unaccent', requiredExtensions: ['unaccent'] }),
        ],
      }),
    ).rejects.toThrow(/unaccent/)
  })

  it('does not throw when the extension is installed even though it is not declared in any config option', async () => {
    const drizzle = drizzleWithInstalledExtensions(['unaccent'])

    await expect(
      assertOperatorHandlerExtensionsInstalled({
        drizzle: drizzle as any,
        operatorHandlers: [transformHandler({ requiredExtensions: ['unaccent'] })],
      }),
    ).resolves.toBeUndefined()
  })
})
