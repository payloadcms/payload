import { describe, expect, it } from 'vitest'

import { findVersionsOperation } from './findVersions.js'

describe('findVersionsOperation', () => {
  it('throws 400 when versions are not enabled on the global', async () => {
    const globalConfig = {
      slug: 'my-global',
      versions: false,
      access: {},
      hooks: {},
      fields: [],
    } as any

    await expect(
      findVersionsOperation({
        globalConfig,
        req: {
          payload: { config: {} },
          locale: 'en',
          fallbackLocale: 'en',
          context: {},
        } as any,
      }),
    ).rejects.toThrow('Versions are not enabled')
  })

  it('throws 400 when versions config is undefined', async () => {
    const globalConfig = {
      slug: 'settings',
      access: {},
      hooks: {},
      fields: [],
    } as any

    await expect(
      findVersionsOperation({
        globalConfig,
        req: {
          payload: { config: {} },
          locale: 'en',
          fallbackLocale: 'en',
          context: {},
        } as any,
      }),
    ).rejects.toThrow('Versions are not enabled')
  })
})
