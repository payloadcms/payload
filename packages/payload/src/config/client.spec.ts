import type { I18nClient } from '@payloadcms/translations'

import type { SanitizedConfig } from './types.js'

import { describe, expect, it } from 'vitest'

import { createClientConfig } from './client.js'

describe('createClientConfig', () => {
  it('should omit baseAccess from the client config', () => {
    const clientConfig = createClientConfig({
      config: {
        baseAccess: {
          collections: {
            read: () => true,
          },
        },
      } as SanitizedConfig,
      i18n: {} as I18nClient,
      importMap: {},
      user: true,
    })

    expect(clientConfig).not.toHaveProperty('baseAccess')
  })
  it('should serialize widget control labels without exposing functions', () => {
    const clientConfig = createClientConfig({
      config: {
        admin: {
          dashboard: {
            widgets: [
              {
                slug: 'sales',
                Component: './Sales.js',
                controls: [
                  {
                    name: 'timeframe',
                    type: 'select',
                    label: () => 'Timeframe',
                    options: [{ label: () => 'Monthly', value: 'monthly' }],
                  },
                ],
              },
            ],
          },
        },
      } as unknown as SanitizedConfig,
      i18n: { language: 'en' } as I18nClient,
      importMap: {},
      user: true,
    })

    expect(clientConfig.admin.dashboard.widgets[0].controls).toEqual([
      {
        name: 'timeframe',
        type: 'select',
        label: 'Timeframe',
        options: [{ label: 'Monthly', value: 'monthly' }],
      },
    ])
  })
})
