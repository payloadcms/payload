import type { I18nClient } from '@payloadcms/translations'
import type { ClientConfig, ClientField, FieldSchemaMap, Payload } from 'payload'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getClientSchemaMap } from './getClientSchemaMap.js'

const payload = {
  config: { db: { defaultIDType: 'number' } },
  importMap: {},
} as unknown as Payload

const schemaMap: FieldSchemaMap = new Map()

const translations: Record<string, Record<string, string>> = {
  en: {
    'authentication:confirmPassword': 'Confirm Password',
    'general:password': 'Password',
  },
  fr: {
    'authentication:confirmPassword': 'Confirmer le mot de passe',
    'general:password': 'Mot de passe',
  },
}

const createI18n = (language: 'en' | 'fr') =>
  ({
    language,
    t: (key: string) => translations[language]![key] ?? key,
  }) as unknown as I18nClient

// The client config is built per language, so labels are already translated in it
const createConfig = ({ auth, label }: { auth?: boolean; label: string }): ClientConfig =>
  ({
    collections: [
      {
        slug: 'pages',
        ...(auth ? { auth: {} } : {}),
        fields: [{ name: 'title', type: 'text', label }],
      },
    ],
    globals: [],
  }) as unknown as ClientConfig

const getLabel = (map: Map<string, unknown>, path: string) => (map.get(path) as ClientField).label

describe('getClientSchemaMap', () => {
  beforeEach(() => {
    global._payload_doNotCacheClientSchemaMap = true
  })

  afterEach(() => {
    global._payload_clientSchemaMap = null
    global._payload_doNotCacheClientSchemaMap = true
  })

  it('should cache client schema maps per language', () => {
    const fr = getClientSchemaMap({
      collectionSlug: 'pages',
      config: createConfig({ label: 'Titre' }),
      i18n: createI18n('fr'),
      payload,
      schemaMap,
    })

    const en = getClientSchemaMap({
      collectionSlug: 'pages',
      config: createConfig({ label: 'Title' }),
      i18n: createI18n('en'),
      payload,
      schemaMap,
    })

    expect(getLabel(fr, 'pages.title')).toBe('Titre')
    expect(getLabel(en, 'pages.title')).toBe('Title')

    const enAgain = getClientSchemaMap({
      collectionSlug: 'pages',
      config: createConfig({ label: 'Title' }),
      i18n: createI18n('en'),
      payload,
      schemaMap,
    })

    expect(enAgain).toBe(en)
  })

  it('should not change the auth field labels of a cached language', () => {
    const en = getClientSchemaMap({
      collectionSlug: 'pages',
      config: createConfig({ auth: true, label: 'Title' }),
      i18n: createI18n('en'),
      payload,
      schemaMap,
    })

    const fr = getClientSchemaMap({
      collectionSlug: 'pages',
      config: createConfig({ auth: true, label: 'Titre' }),
      i18n: createI18n('fr'),
      payload,
      schemaMap,
    })

    expect(getLabel(en, 'pages.password')).toBe('Password')
    expect(getLabel(en, 'pages.confirm-password')).toBe('Confirm Password')
    expect(getLabel(fr, 'pages.password')).toBe('Mot de passe')
    expect(getLabel(fr, 'pages.confirm-password')).toBe('Confirmer le mot de passe')
  })
})
