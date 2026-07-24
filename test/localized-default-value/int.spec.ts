import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { collectionSlug, defaultLocale, spanishLocale, staticDefaultValue } from './shared.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type LocalizedFieldAllLocales = {
  en?: string
  es?: string
}

describe('localized defaultValue', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should apply defaultValue only to the current locale on create', async () => {
    const doc = await payload.create({
      collection: collectionSlug,
      data: {
        title: 'English title',
      },
      locale: defaultLocale,
    })

    expect(doc.myField).toStrictEqual(staticDefaultValue)
    expect(doc.localeAwareField).toStrictEqual(`default-${defaultLocale}`)

    const allLocales = (await payload.findByID({
      id: doc.id,
      collection: collectionSlug,
      locale: 'all',
    })) as {
      localeAwareField: LocalizedFieldAllLocales
      myField: LocalizedFieldAllLocales
    }

    expect(allLocales.myField.en).toStrictEqual(staticDefaultValue)
    expect(allLocales.myField.es).toBeUndefined()
    expect(allLocales.localeAwareField.en).toStrictEqual(`default-${defaultLocale}`)
    expect(allLocales.localeAwareField.es).toBeUndefined()
  })

  it('should not apply defaultValue when reading an unwritten locale', async () => {
    const doc = await payload.create({
      collection: collectionSlug,
      data: {
        title: 'English title',
      },
      locale: defaultLocale,
    })

    const spanishDoc = await payload.findByID({
      id: doc.id,
      collection: collectionSlug,
      fallbackLocale: false,
      locale: spanishLocale,
    })

    expect(spanishDoc.myField).toBeUndefined()
    expect(spanishDoc.localeAwareField).toBeUndefined()
  })

  it('should apply defaultValue only to the current locale on update', async () => {
    const doc = await payload.create({
      collection: collectionSlug,
      data: {
        title: 'Initial title',
      },
      locale: defaultLocale,
    })

    await payload.update({
      id: doc.id,
      collection: collectionSlug,
      data: {
        title: 'Spanish title',
      },
      locale: spanishLocale,
    })

    const allLocales = (await payload.findByID({
      id: doc.id,
      collection: collectionSlug,
      locale: 'all',
    })) as {
      localeAwareField: LocalizedFieldAllLocales
      myField: LocalizedFieldAllLocales
    }

    expect(allLocales.myField.en).toStrictEqual(staticDefaultValue)
    expect(allLocales.myField.es).toBeUndefined()
    expect(allLocales.localeAwareField.en).toStrictEqual(`default-${defaultLocale}`)
    expect(allLocales.localeAwareField.es).toBeUndefined()
  })

  it('should apply function defaultValue using the current locale only', async () => {
    const doc = await payload.create({
      collection: collectionSlug,
      data: {
        title: 'Spanish title',
      },
      locale: spanishLocale,
    })

    expect(doc.localeAwareField).toStrictEqual(`default-${spanishLocale}`)

    const allLocales = (await payload.findByID({
      id: doc.id,
      collection: collectionSlug,
      locale: 'all',
    })) as {
      localeAwareField: LocalizedFieldAllLocales
    }

    expect(allLocales.localeAwareField.en).toBeUndefined()
    expect(allLocales.localeAwareField.es).toStrictEqual(`default-${spanishLocale}`)
  })
})
