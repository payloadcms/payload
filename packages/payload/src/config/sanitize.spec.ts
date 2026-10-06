import type { Config } from './types.js'

import { describe, expect, it } from 'vitest'

import { configToJSONSchema } from '../utilities/configToJSONSchema.js'
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
      strictDraftTypes: true,
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

  it.each([undefined, { autoGenerate: false }, { strictDraftTypes: undefined }])(
    'should generate strict draft types by default with TypeScript options %j',
    (typescript) => {
      const config = sanitizeConfig({ ...configDefaults, typescript })
      const { jsonSchema } = configToJSONSchema(config, 'text')

      expect(jsonSchema.properties?.strictDraftTypes).toEqual({ type: 'boolean', const: true })
      expect(jsonSchema.required).toContain('strictDraftTypes')
    },
  )

  it('should preserve an explicit opt-out of strict draft types in generated types', () => {
    const config = sanitizeConfig({
      ...configDefaults,
      typescript: { strictDraftTypes: false },
    })
    const { jsonSchema } = configToJSONSchema(config, 'text')

    expect(config.typescript.strictDraftTypes).toBe(false)
    expect(jsonSchema.properties).not.toHaveProperty('strictDraftTypes')
    expect(jsonSchema.required).not.toContain('strictDraftTypes')
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
