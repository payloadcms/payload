import type { ListQuery } from 'payload'

import { describe, expect, it } from 'vitest'

import { buildRenderDocumentArgs, buildRenderListArgs } from './buildRenderViewArgs.js'

describe('buildRenderViewArgs', () => {
  it('should build render-list args for trash views', () => {
    const query = {
      limit: 10,
      sort: '-createdAt',
    } satisfies ListQuery

    expect(
      buildRenderListArgs({
        pageState: {
          searchParams: {
            notFound: '123',
          },
          routeParams: {
            collection: 'posts',
          },
          viewType: 'trash',
        } as any,
        query,
      }),
    ).toEqual({
      collectionSlug: 'posts',
      enableRowSelections: true,
      query,
      searchParams: {
        notFound: '123',
      },
      trash: true,
      viewType: 'trash',
    })
  })

  it('should build render-document args for global api views', () => {
    expect(
      buildRenderDocumentArgs({
        pageState: {
          documentSubViewType: 'api',
          routeParams: {
            global: 'settings',
          },
          searchParams: {
            locale: 'en',
          },
          segments: ['globals', 'settings', 'api'],
          viewType: 'document',
        } as any,
      }),
    ).toEqual({
      collectionSlug: 'settings',
      docID: undefined,
      documentSubViewType: 'api',
      paramsOverride: {
        segments: ['globals', 'settings', 'api'],
      },
      redirectAfterCreate: false,
      searchParams: {
        locale: 'en',
      },
      viewType: 'document',
    })
  })
})
