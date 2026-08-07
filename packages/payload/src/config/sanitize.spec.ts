import type { Config } from './types.js'

import { describe, expect, it } from 'vitest'

import { sanitizeConfig } from './sanitize.js'

describe('sanitizeConfig', () => {
  it('should populate sanitized root config defaults for a minimal config', () => {
    // @ts-expect-error partial config
    const config: Config = {
      collections: [],
    }

    const sanitizedConfig = sanitizeConfig(config)

    expect(sanitizedConfig.admin).toMatchObject({
      avatar: 'gravatar',
      components: {},
      custom: {},
      dashboard: {
        defaultLayout: [{ widgetSlug: 'collections', width: 'full' }],
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

  it('should populate sanitized localization defaults with no locales', () => {
    // @ts-expect-error partial config
    const config: Config = {
      collections: [],
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
