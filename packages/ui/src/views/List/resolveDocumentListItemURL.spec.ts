import type { PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { resolveDocumentListItemURL } from './resolveDocumentListItemURL.js'

const req = { payload: { config: { routes: { admin: '/custom-admin' } } } } as PayloadRequest

const doc = { id: 'document/1', title: 'Example' }

describe('resolveDocumentListItemURL', () => {
  it('should use the configured admin route and encode document IDs', () => {
    expect(
      resolveDocumentListItemURL({ collectionSlug: 'posts', doc, req, viewType: 'list' }),
    ).toBe('/custom-admin/collections/posts/document%2F1')
  })

  it('should pass the document, request, and trash URL to formatDocURL', () => {
    const formatDocURL = vi.fn(({ defaultURL }) => `${defaultURL}?from=trash`)

    const url = resolveDocumentListItemURL({
      collectionSlug: 'posts',
      doc,
      formatDocURL,
      req,
      viewType: 'trash',
    })

    expect(url).toBe('/custom-admin/collections/posts/trash/document%2F1?from=trash')
    expect(formatDocURL).toHaveBeenCalledWith({
      collectionSlug: 'posts',
      defaultURL: '/custom-admin/collections/posts/trash/document%2F1',
      doc,
      req,
      viewType: 'trash',
    })
  })

  it('should honor a custom destination', () => {
    expect(
      resolveDocumentListItemURL({
        collectionSlug: 'posts',
        doc,
        formatDocURL: () => '/custom-destination',
        req,
        viewType: 'list',
      }),
    ).toBe('/custom-destination')
  })

  it('should disable navigation when formatDocURL returns null', () => {
    expect(
      resolveDocumentListItemURL({
        collectionSlug: 'posts',
        doc,
        formatDocURL: () => null,
        req,
        viewType: 'list',
      }),
    ).toBeNull()
  })

  it('should pass the hierarchy destination to formatDocURL in the All view', () => {
    const formatDocURL = vi.fn(({ defaultURL }) => defaultURL)

    const url = resolveDocumentListItemURL({
      collectionSlug: 'folders',
      doc,
      formatDocURL,
      hierarchyParentFieldName: 'parentFolder',
      req,
      viewType: 'list',
    })

    expect(url).toBe('/custom-admin/collections/folders?parentFolder=document%2F1&view=hierarchy')
  })
})
