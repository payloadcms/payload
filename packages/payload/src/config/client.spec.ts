import type { I18nClient } from '@payloadcms/translations'

import { describe, expect, it } from 'vitest'

import { createClientConfig } from './client.js'
import type { SanitizedConfig } from './types.js'

describe('createClientConfig', () => {
  it('omits the server-only root upload config from the client config', () => {
    const config = {
      admin: { routes: {}, user: 'users' },
      collections: [],
      db: { defaultIDType: 'number' },
      globals: [],
      upload: {
        adapters: [],
        safeFileNames: /[^a-z0-9]/gi,
      },
    } as unknown as SanitizedConfig

    const clientConfig = createClientConfig({
      config,
      i18n: {} as I18nClient,
      importMap: {},
      user: true,
    })

    expect(clientConfig).not.toHaveProperty('upload')
  })
})
