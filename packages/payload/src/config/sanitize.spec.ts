import type { Config } from './types.js'

import { describe, expect, it } from 'vitest'

import { sanitizeConfig } from './sanitize.js'

const configDefaults: Config = {
  db: {
    defaultIDType: 'text',
    // @ts-expect-error partial config
    init: () => {},
  },
  secret: 'secret',
}

describe('sanitizeConfig', () => {
  it('should populate sanitized root config defaults for a minimal config', () => {
    const config: Config = {
      ...configDefaults,
    }

    const sanitizedConfig = sanitizeConfig(config)

    expect(sanitizedConfig.admin).toMatchObject({
      avatar: 'gravatar',
      components: {},
      custom: {},
      dashboard: {
        defaultLayout: [
          { widgetSlug: 'collections', width: 'full' },
          { widgetSlug: 'activity', width: 'small' },
        ],
        widgets: expect.any(Array),
      },
      dateFormat: 'MMMM do yyyy, h:mm a',
      dependencies: {},
      importMap: {
        baseDir: process.cwd(),
      },
      meta: {
        defaultOGImageType: 'dynamic',
        robots: 'noindex, nofollow',
        titleSuffix: '- Payload',
      },
      routes: {
        account: '/account',
        createFirstUser: '/create-first-user',
        forgot: '/forgot',
        inactivity: '/logout-inactivity',
        login: '/login',
        logout: '/logout',
        reset: '/reset',
        unauthorized: '/unauthorized',
      },
      theme: 'all',
      timezones: {
        supportedTimezones: expect.any(Array),
      },
      user: 'users',
    })
    expect(sanitizedConfig.graphQL).toEqual({
      disableIntrospectionInProduction: true,
      disablePlaygroundInProduction: true,
      maxComplexity: 1000,
      schemaOutputFile: `${process.cwd()}/schema.graphql`,
    })
    expect(sanitizedConfig.typescript).toEqual({
      autoGenerate: true,
      outputFile: `${process.cwd()}/payload-types.ts`,
    })
    expect(sanitizedConfig.routes).toEqual({
      admin: '/admin',
      api: '/api',
      graphQL: '/graphql',
      graphQLPlayground: '/graphql-playground',
    })
  })

  it('should populate a nested default when the property is explicitly undefined', () => {
    const config: Config = {
      ...configDefaults,
      admin: {
        avatar: undefined,
      },
    }

    const sanitizedConfig = sanitizeConfig(config)

    expect(sanitizedConfig.admin.avatar).toBe('gravatar')
  })

  it('should throw when a collection uses the reserved payload-api-keys slug', () => {
    const config: Config = {
      ...configDefaults,
      collections: [
        {
          slug: 'payload-api-keys',
          fields: [],
        },
      ],
    }

    expect(() => sanitizeConfig(config)).toThrow(/payload-api-keys/)
  })

  it('should register the apiKeys join field on a collection-mode auth collection', () => {
    const config: Config = {
      ...configDefaults,
      collections: [
        {
          slug: 'users',
          auth: {
            useAPIKey: {
              storage: 'collection',
            },
          },
          fields: [],
        },
      ],
    }

    const sanitizedConfig = sanitizeConfig(config)

    const users = sanitizedConfig.collections.find((collection) => collection.slug === 'users')
    const apiKeysField = users?.fields.find((field) => 'name' in field && field.name === 'apiKeys')

    expect(apiKeysField).toMatchObject({ collection: 'payload-api-keys', on: 'owner' })
    expect(users?.joins['payload-api-keys']).toHaveLength(1)
    expect(users?.joins['payload-api-keys']?.[0]?.joinPath).toBe('apiKeys')
  })

  it('should populate sanitized localization defaults with no locales', () => {
    const config: Config = {
      ...configDefaults,
      localization: {
        defaultLocale: 'en',
        locales: [],
      },
    }

    const sanitizedConfig = sanitizeConfig(config)

    expect(sanitizedConfig.localization).toEqual({
      defaultLocale: 'en',
      fallback: true,
      localeCodes: [],
      locales: [],
    })
  })
})
