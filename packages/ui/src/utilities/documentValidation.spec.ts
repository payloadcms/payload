import type { ClientBlock, ClientField, SanitizedLocale } from 'payload'

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getPublishValidationLocales,
  getValidationEndpoint,
  projectValidationDataForSiblingLocales,
  requestDocumentValidation,
  validateDocumentLocales,
} from './documentValidation.js'
import { traverseForLocalizedFields } from './traverseForLocalizedFields.js'

const locales = [
  { code: 'en', label: 'English', required: true },
  { code: 'de', label: 'German', required: false },
  { code: 'fr', label: 'French', required: true },
] as SanitizedLocale[]

describe('document validation', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should construct create, update, and global validation endpoints', () => {
    expect(
      getValidationEndpoint({
        apiRoute: '/api',
        collectionSlug: 'posts',
      }),
    ).toBe('/api/posts/validate')
    expect(
      getValidationEndpoint({
        apiRoute: '/api',
        collectionSlug: 'posts',
        id: 'post/id',
      }),
    ).toBe('/api/posts/post%2Fid/validate')
    expect(
      getValidationEndpoint({
        apiRoute: '/api',
        globalSlug: 'settings',
      }),
    ).toBe('/api/globals/settings/validate')
  })

  it('should detect localized fields inside referenced blocks', () => {
    const fields = [
      {
        blocks: ['hero'],
        name: 'layout',
        type: 'blocks',
      },
    ] as ClientField[]
    const blocksMap = {
      hero: {
        fields: [{ localized: true, name: 'heading', type: 'text' }],
        slug: 'hero',
      },
    } as Record<string, ClientBlock>

    expect(traverseForLocalizedFields(fields, { blocksMap })).toBe(true)
  })

  it('should select all locales for publish-all and active plus required locales otherwise', () => {
    expect(
      getPublishValidationLocales({
        activeLocale: 'de',
        isPublishAll: false,
        locales,
      }),
    ).toEqual(['de', 'en', 'fr'])
    expect(
      getPublishValidationLocales({
        activeLocale: 'de',
        isPublishAll: true,
        locales,
      }),
    ).toEqual(['en', 'de', 'fr'])
  })

  it('should remove localized values from nested sibling-locale candidate data', () => {
    const fields = [
      { localized: true, name: 'title', type: 'text' },
      {
        fields: [
          { localized: true, name: 'strapline', type: 'text' },
          { name: 'theme', type: 'text' },
        ],
        name: 'settings',
        type: 'group',
      },
      {
        fields: [
          { localized: true, name: 'caption', type: 'text' },
          { name: 'kind', type: 'text' },
        ],
        name: 'items',
        type: 'array',
      },
      {
        blocks: [
          {
            fields: [
              { localized: true, name: 'copy', type: 'text' },
              { name: 'style', type: 'text' },
            ],
            slug: 'hero',
          },
        ],
        name: 'layout',
        type: 'blocks',
      },
      {
        tabs: [
          {
            fields: [{ name: 'body', type: 'richText' }],
            localized: true,
            name: 'seo',
          },
        ],
        type: 'tabs',
      },
      { localized: true, name: 'metadata', type: 'json' },
    ] as ClientField[]

    expect(
      projectValidationDataForSiblingLocales({
        blocksMap: {},
        data: {
          layout: [{ blockType: 'hero', copy: 'Active copy', style: 'dark' }],
          items: [{ caption: 'Active caption', kind: 'card' }],
          metadata: { title: 'Active metadata' },
          settings: { strapline: 'Active strapline', theme: 'dark' },
          seo: { body: { root: {} } },
          title: 'Active title',
        },
        fields,
      }),
    ).toEqual({
      layout: [{ blockType: 'hero', style: 'dark' }],
      items: [{ kind: 'card' }],
      settings: { theme: 'dark' },
    })
  })

  it('should not let valid unsaved active-locale values satisfy invalid stored sibling locales', async () => {
    const request = vi.fn(async ({ body, locales: requestedLocales }) => {
      if (requestedLocales.includes('de') && 'title' in body) {
        return {
          errors: [],
          valid: true,
        }
      }

      return {
        errors: [{ locale: 'fr', message: 'Title is required', path: 'title' }],
        valid: false,
      }
    })

    const result = await validateDocumentLocales({
      activeLocale: 'de',
      blocksMap: {},
      data: { summary: 'Shared summary', title: 'Unsaved German title' },
      endpoint: '/api/posts/123/validate',
      fields: [
        { localized: true, name: 'title', type: 'text' },
        { name: 'summary', type: 'text' },
      ],
      locales: ['en', 'de', 'fr'],
      request,
    })

    expect(request).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        body: { summary: 'Shared summary', title: 'Unsaved German title' },
        locales: ['de'],
      }),
    )
    expect(request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        body: { summary: 'Shared summary' },
        locales: ['en', 'fr'],
      }),
    )
    expect(result).toEqual({
      errors: [{ locale: 'fr', message: 'Title is required', path: 'title' }],
      valid: false,
    })
  })

  it('should render validation errors returned in a non-2xx Payload error response', async () => {
    const fetchMock = vi.fn(async () => {
      return Response.json(
        {
          errors: [
            {
              data: {
                errors: [{ locale: 'fr', message: 'Title is required', path: 'title' }],
              },
              message: 'The following field is invalid: title',
              name: 'ValidationError',
            },
          ],
        },
        { status: 400 },
      )
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(
      requestDocumentValidation({
        body: { title: 'Titre' },
        endpoint: '/api/posts/123/validate',
        locales: ['en', 'fr'],
      }),
    ).resolves.toEqual({
      errors: [{ locale: 'fr', message: 'Title is required', path: 'title' }],
      valid: false,
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/posts/123/validate?locale=en&locale=fr',
      expect.objectContaining({
        body: JSON.stringify({ title: 'Titre' }),
        credentials: 'include',
        method: 'POST',
      }),
    )
  })
})
