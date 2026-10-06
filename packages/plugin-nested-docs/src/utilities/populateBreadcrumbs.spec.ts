import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { populateBreadcrumbs } from './populateBreadcrumbs.js'

const fields = [
  { name: 'title', type: 'text', localized: true },
  { name: 'slug', type: 'text', localized: true },
  { name: 'breadcrumbs', type: 'array', localized: true, fields: [] },
  { name: '_status', type: 'select', localized: true },
]
const collection = {
  slug: 'pages',
  fields,
  flattenedFields: fields,
  versions: { drafts: { localizeStatus: true } },
} as unknown as SanitizedCollectionConfig
const originalDoc = {
  id: 'self',
  title: { en: 'English title', fr: 'Titre français' },
  slug: { en: 'english', fr: 'francais' },
  breadcrumbs: { en: [{ id: 'en-row' }], fr: [{ id: 'fr-row' }] },
}
const makeRequest = () =>
  ({
    locale: 'all',
    payload: { config: { localization: { locales: [{ code: 'en' }, { code: 'fr' }] } } },
  }) as unknown as PayloadRequest
const generateLabel = (_: unknown, doc: Record<string, unknown>) => doc.title as string
const generateURL = (docs: Record<string, unknown>[]) =>
  docs.map((doc) => `/${doc.slug as string}`).join('')

describe('all-locale breadcrumb updates', () => {
  it.each(['title', 'slug'] as const)(
    'should retain omitted fields and row IDs in a %s-only update',
    async (field) => {
      const result = await populateBreadcrumbs({
        collection,
        originalDoc,
        data: { [field]: { en: 'Changed', fr: 'Modifié' } },
        generateLabel,
        generateURL,
        req: makeRequest(),
      })

      expect(result.breadcrumbs).toEqual({
        en: [
          {
            id: 'en-row',
            doc: 'self',
            label: field === 'title' ? 'Changed' : 'English title',
            url: field === 'slug' ? '/Changed' : '/english',
          },
        ],
        fr: [
          {
            id: 'fr-row',
            doc: 'self',
            label: field === 'title' ? 'Modifié' : 'Titre français',
            url: field === 'slug' ? '/Modifié' : '/francais',
          },
        ],
      })
    },
  )

  it('should retain each locale status when selecting draft ancestors for partial updates', async () => {
    const req = makeRequest()
    const findByID = vi.fn(async ({ version }: { version: string }) => ({
      id: 'parent',
      title: version === 'latest' ? 'Draft parent' : 'Live parent',
      slug: version === 'latest' ? 'draft-parent' : 'live-parent',
    }))
    req.payload.findByID = findByID as unknown as typeof req.payload.findByID
    const result = await populateBreadcrumbs({
      collection,
      originalDoc: { ...originalDoc, parent: 'parent', _status: { en: 'draft', fr: 'published' } },
      data: { title: { en: 'Changed', fr: 'Modifié' } },
      generateLabel,
      generateURL,
      req,
    })

    expect(findByID.mock.calls.map(([options]) => options.version)).toEqual(['latest', 'published'])
    expect(result.breadcrumbs).toMatchObject({
      en: [
        { doc: 'parent', label: 'Draft parent' },
        { doc: 'self', url: '/draft-parent/english' },
      ],
      fr: [
        { doc: 'parent', label: 'Live parent' },
        { doc: 'self', url: '/live-parent/francais' },
      ],
    })
  })
  it('should preserve breadcrumbs in filtered locales without generating them', async () => {
    const req = makeRequest()
    if (req.payload.config.localization) {
      req.payload.config.localization.filterAvailableLocales = ({ locales }) =>
        locales.filter((locale) => locale.code === 'en')
    }
    const result = await populateBreadcrumbs({
      collection,
      originalDoc,
      data: { slug: { en: 'Changed' } },
      generateLabel,
      generateURL,
      req,
    })

    expect(result.breadcrumbs).toEqual({
      en: [{ id: 'en-row', doc: 'self', label: 'English title', url: '/Changed' }],
      fr: originalDoc.breadcrumbs.fr,
    })
  })
})
