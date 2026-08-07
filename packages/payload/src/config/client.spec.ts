import type { SanitizedConfig } from './types.js'

import { describe, expect, it } from 'vitest'

import { createClientConfig } from './client.js'

describe('createClientConfig', () => {
  it('should retain sanitized required locale metadata without locale filtering', () => {
    const config = {
      localization: {
        defaultLocale: 'en',
        localeCodes: ['en', 'es'],
        locales: [
          {
            code: 'en',
            label: 'English',
            required: false,
          },
          {
            code: 'es',
            label: 'Spanish',
            required: true,
          },
        ],
      },
    } as SanitizedConfig

    const clientConfig = createClientConfig({
      config,
      i18n: {} as never,
      importMap: {},
      user: true,
    })

    expect(clientConfig.localization && clientConfig.localization.locales).toMatchObject([
      { code: 'en', required: false },
      { code: 'es', required: true },
    ])
  })
})
