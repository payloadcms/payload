import type { Payload } from 'payload'

import { renderTabHandler } from '@payloadcms/ui/rsc'
import { renderToStaticMarkup } from 'react-dom/server'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { describe, suite, test } from '../__helpers/int/vitest.js'

const tagsSlug = 'tags'
const postsSlug = 'posts'

suite('Tags Helpers', { config: './config.ts' }, () => {
  describe('createTagsCollection', () => {
    test('should create a collection with hierarchy enabled', ({ payload }) => {
      const tagsCollection = payload.config.collections.find((c) => c.slug === tagsSlug)

      expect(tagsCollection).toBeDefined()
      expect(tagsCollection?.hierarchy).toBeDefined()
      expect(tagsCollection?.hierarchy).not.toBe(false)
    })

    test('should have parentFieldName in hierarchy config', ({ payload }) => {
      const tagsCollection = payload.config.collections.find((c) => c.slug === tagsSlug)
      expect(tagsCollection?.hierarchy).not.toBe(false)

      if (tagsCollection?.hierarchy !== false) {
        expect(tagsCollection?.hierarchy).toHaveProperty('parentFieldName')
      }
    })

    test('should add parent field to tags collection', ({ payload }) => {
      const tagsCollection = payload.config.collections.find((c) => c.slug === tagsSlug)
      expect(tagsCollection?.hierarchy).not.toBe(false)

      if (tagsCollection?.hierarchy !== false) {
        const parentFieldName = tagsCollection?.hierarchy?.parentFieldName
        const parentField = tagsCollection?.fields.find(
          (f: any) => f.name === parentFieldName && f.type === 'relationship',
        )

        expect(parentField).toBeDefined()

        expect(parentField).toMatchObject({
          type: 'relationship',
          hasMany: false,
          relationTo: tagsSlug,
        })
      }
    })

    test('should add virtual path fields', ({ payload }) => {
      const tagsCollection = payload.config.collections.find((c) => c.slug === tagsSlug)

      const slugPathField = tagsCollection?.fields.find((f: any) => f.name === '_h_slugPath')
      const titlePathField = tagsCollection?.fields.find((f: any) => f.name === '_h_titlePath')

      expect(slugPathField).toBeDefined()
      expect(titlePathField).toBeDefined()
      expect((slugPathField as any)?.virtual).toBe(true)
      expect((titlePathField as any)?.virtual).toBe(true)
    })
  })

  describe('createTagField', () => {
    test('should add tag relationship field to collection', ({ payload }) => {
      const postsCollection = payload.config.collections.find((c) => c.slug === postsSlug)
      const tagField = postsCollection?.fields.find(
        (f: any) => f.name === `_h_${tagsSlug}` && f.type === 'relationship',
      )

      expect(tagField).toBeDefined()
      expect(tagField).toMatchObject({
        type: 'relationship',
        relationTo: tagsSlug,
        hasMany: true,
      })
    })

    test('should configure hasMany based on helper options', ({ payload }) => {
      const postsCollection = payload.config.collections.find((c) => c.slug === postsSlug)
      const tagField = postsCollection?.fields.find(
        (f: any) => f.name === `_h_${tagsSlug}` && f.type === 'relationship',
      )

      expect((tagField as any)?.hasMany).toBe(true)
    })
  })
  describe('render-tab searchParams precedence', () => {
    const tabSlug = 'precedence-tab'

    const getForwardedSearchParams = (
      { payload }: { payload: Payload },
      {
        query,
        searchParams,
      }: {
        query?: Record<string, unknown>
        searchParams?: Record<string, unknown>
      },
    ): unknown => {
      let forwardedSearchParams: unknown

      const Content = (props: { searchParams?: unknown }) => {
        forwardedSearchParams = props.searchParams
        return null
      }

      const args = {
        req: {
          i18n: {},
          locale: undefined,
          payload: {
            config: {
              admin: {
                components: { sidebar: { tabs: [{ slug: tabSlug, components: { Content } }] } },
              },
            },
            importMap: payload.importMap,
            logger: payload.logger,
          },
          query,
          routeParams: {},
          user: { id: 'user-1' },
        },
        searchParams,
        tabSlug,
      } as unknown as Parameters<typeof renderTabHandler>[0]

      const { component } = renderTabHandler(args)
      renderToStaticMarkup(component)

      return forwardedSearchParams
    }

    test('should forward the provided searchParams to the rendered tab', ({ payload }) => {
      const forwarded = getForwardedSearchParams(
        { payload },
        {
          query: { parent: 'from-query' },
          searchParams: { parent: 'from-args' },
        },
      )

      expect(forwarded).toEqual({ parent: 'from-args' })
    })

    test('should fall back to req.query when searchParams is undefined', ({ payload }) => {
      const forwarded = getForwardedSearchParams({ payload }, { query: { parent: 'from-query' } })

      expect(forwarded).toEqual({ parent: 'from-query' })
    })

    test('should use an explicitly empty searchParams object instead of falling back to req.query', ({
      payload,
    }) => {
      const forwarded = getForwardedSearchParams(
        { payload },
        {
          query: { parent: 'from-query' },
          searchParams: {},
        },
      )

      expect(forwarded).toEqual({})
    })
  })
})
