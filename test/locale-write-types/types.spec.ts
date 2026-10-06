/* eslint-disable @typescript-eslint/unbound-method -- TSTyche checks method signatures without invoking them. */
import type { UntypedPayloadTypes } from 'payload'

import { PayloadSDK } from '@payloadcms/sdk'
import payload from 'payload'
import { describe, expect, test } from 'tstyche'

type LocalizedDoc = {
  _status?: 'draft' | 'published'
  createdAt: string
  description: string
  details?: { heading?: string; note?: string }
  id: string
  rows?: { id?: string; label: string; note?: string }[]
  title: string
  updatedAt: string
}

type Config = {
  collections: { localized: LocalizedDoc; plain: { id: string; title: string } }
  collectionsInput: {
    localized: Omit<LocalizedDoc, 'createdAt' | 'id' | 'updatedAt'>
    plain: { title: string }
  }
  collectionsSelect: { localized: { title?: boolean }; plain: { title?: boolean } }
  globals: {
    settings: { _status?: 'draft' | 'published'; details?: { heading?: string }; title: string }
  }
  globalsSelect: { settings: { title?: boolean } }
  locale: 'en' | 'fr'
} & Omit<
  UntypedPayloadTypes,
  'collections' | 'collectionsSelect' | 'globals' | 'globalsSelect' | 'locale'
>

declare module 'payload' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Exercise generated type augmentation.
  interface GeneratedTypes extends Config {}
}

const sdk = new PayloadSDK<Config>({ baseURL: '' })

describe('locale all write input types', () => {
  test('should accept mapped fields and ordinary shared data in Local API creates', () => {
    expect(payload.create).type.toBeCallableWith({
      collection: 'localized',
      data: {
        description: 'Shared description',
        details: { heading: { en: 'English', fr: 'French' }, note: 'Shared note' },
        rows: { en: [{ label: 'English row' }], fr: [{ label: 'French row' }] },
        title: { en: 'English', fr: 'French' },
      },
      locale: 'all',
      version: 'published',
    })
    expect(payload.create).type.toBeCallableWith({
      collection: 'localized',
      data: {},
      locale: 'all',
    })
  })

  test('should retain scalar inputs when the locale is selected dynamically', () => {
    const locale = {} as 'all' | 'en'

    expect(payload.update).type.toBeCallableWith({
      id: '1',
      collection: 'localized',
      data: { title: 'Shared value' },
      locale,
    })
    expect(sdk.updateGlobal).type.toBeCallableWith({
      slug: 'settings',
      data: { title: 'Shared value' },
      locale,
    })
  })

  test('should accept mapped fields in Local API updates by ID and query', () => {
    expect(payload.update).type.toBeCallableWith({
      id: '1',
      collection: 'localized',
      data: { rows: [{ label: { en: 'English', fr: 'French' }, note: 'Shared note' }] },
      locale: 'all',
    })
    expect(payload.update).type.toBeCallableWith({
      collection: 'localized',
      data: { title: { en: 'English', fr: 'French' } },
      locale: 'all',
      where: { id: { equals: '1' } },
    })
    expect(payload.updateGlobal).type.toBeCallableWith({
      slug: 'settings',
      data: { details: { heading: { en: 'English', fr: 'French' } }, title: { en: 'English' } },
      locale: 'all',
    })
  })

  test('should retain required published data, field value types, and known locale keys', () => {
    expect(payload.create).type.not.toBeCallableWith({
      collection: 'localized',
      data: { title: { en: 'English' } },
      locale: 'all',
      version: 'published',
    })
    expect(payload.update).type.not.toBeCallableWith({
      id: '1',
      collection: 'localized',
      data: { title: { en: 123 } },
      locale: 'all',
    })
    expect(payload.create).type.not.toBeCallableWith({
      collection: 'localized',
      data: { id: { en: '1' } },
      locale: 'all',
    })
    expect(payload.update).type.not.toBeCallableWith({
      id: '1',
      collection: 'localized',
      data: { title: { de: 'German' } },
      locale: 'all',
    })
  })

  test('should reject locale maps for single-locale and omitted-locale writes', () => {
    expect(payload.create).type.not.toBeCallableWith({
      collection: 'localized',
      data: { title: { en: 'English' } },
      locale: 'en',
    })
    expect(payload.update).type.not.toBeCallableWith({
      id: '1',
      collection: 'localized',
      data: { title: { en: 'English' } },
    })
    expect(payload.updateGlobal).type.not.toBeCallableWith({
      slug: 'settings',
      data: { title: { en: 'English' } },
      locale: 'fr',
    })
  })

  test('should accept locale maps in SDK collection and global writes', () => {
    expect(sdk.create).type.toBeCallableWith({
      collection: 'localized',
      data: { description: 'Shared', title: { en: 'English', fr: 'French' } },
      locale: 'all',
      version: 'published',
    })
    expect(sdk.update).type.toBeCallableWith({
      id: '1',
      collection: 'localized',
      data: { details: { heading: { en: 'English' } } },
      locale: 'all',
    })
    expect(sdk.updateGlobal).type.toBeCallableWith({
      slug: 'settings',
      data: { title: { en: 'English', fr: 'French' } },
      locale: 'all',
    })
  })

  test('should retain SDK required fields and single-locale field types', () => {
    expect(sdk.create).type.not.toBeCallableWith({
      collection: 'localized',
      data: { title: { en: 'English' } },
      locale: 'all',
      version: 'published',
    })
    expect(sdk.update).type.not.toBeCallableWith({
      id: '1',
      collection: 'localized',
      data: { title: { en: 'English' } },
      locale: 'en',
    })
    expect(sdk.updateGlobal).type.not.toBeCallableWith({
      slug: 'settings',
      data: { title: { en: 123 } },
      locale: 'all',
    })
  })
})
