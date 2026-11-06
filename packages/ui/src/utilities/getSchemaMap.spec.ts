import type { I18nClient } from '@payloadcms/translations'
import type { SanitizedConfig } from 'payload'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getSchemaMap } from './getSchemaMap.js'

const i18n = { language: 'en', t: (key: string) => key } as unknown as I18nClient

const createConfig = (fieldNames: string[]): SanitizedConfig =>
  ({
    blocks: [],
    collections: [
      {
        slug: 'pages',
        fields: fieldNames.map((name) => ({ name, type: 'text' })),
      },
    ],
    globals: [],
  }) as unknown as SanitizedConfig

describe('getSchemaMap', () => {
  beforeEach(() => {
    global._payload_doNotCacheSchemaMap = true
  })

  afterEach(() => {
    global._payload_schemaMap = null
    global._payload_doNotCacheSchemaMap = true
  })

  it('should reuse the cached schema map for the same config', () => {
    const config = createConfig(['title'])

    const first = getSchemaMap({ collectionSlug: 'pages', config, i18n })
    const second = getSchemaMap({ collectionSlug: 'pages', config, i18n })

    expect(second).toBe(first)
  })

  it('should rebuild the schema map when called with a different config', () => {
    const previousConfig = createConfig(['title'])
    const nextConfig = createConfig(['title', 'summary'])

    const previous = getSchemaMap({ collectionSlug: 'pages', config: previousConfig, i18n })
    const next = getSchemaMap({ collectionSlug: 'pages', config: nextConfig, i18n })

    expect(previous.has('pages.summary')).toBe(false)
    expect(next.has('pages.summary')).toBe(true)
  })
})
