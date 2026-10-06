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
  it('should register the migration lock global without application configuration', () => {
    const sanitizedConfig = sanitizeConfig({ ...configDefaults })
    const migrationLock = sanitizedConfig.globals.find(
      (global) => global.slug === 'payload-migrations-lock',
    )

    expect(migrationLock).toMatchObject({
      admin: { hidden: true },
      endpoints: false,
      graphQL: false,
      flattenedFields: expect.arrayContaining([
        expect.objectContaining({ name: 'locked', type: 'checkbox', defaultValue: false }),
        expect.objectContaining({ name: 'expires_at', type: 'date' }),
      ]),
    })
  })

  it('should create independent migration lock configs for separate Payload instances', () => {
    const firstConfig = sanitizeConfig({ ...configDefaults })
    const secondConfig = sanitizeConfig({ ...configDefaults })
    const firstLock = firstConfig.globals.find(
      (global) => global.slug === 'payload-migrations-lock',
    )
    const secondLock = secondConfig.globals.find(
      (global) => global.slug === 'payload-migrations-lock',
    )

    expect(firstLock).not.toBe(secondLock)
    expect(firstLock?.fields).not.toBe(secondLock?.fields)
  })

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
          { widgetSlug: 'welcome', width: 'full' },
          { widgetSlug: 'activity', width: 'full' },
          { widgetSlug: 'collections', width: 'full' },
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
