import type { Payload } from 'payload'

import { renderTabHandler } from '@payloadcms/ui/rsc'
import path from 'path'
import { renderToStaticMarkup } from 'react-dom/server'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const tagsSlug = 'tags'
const postsSlug = 'posts'

let payload: Payload

describe('Tags Helpers', () => {
  beforeAll(async () => {
    const result = await initPayloadInt(dirname)
    payload = result.payload
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('createTagsCollection', () => {
    it('should create a collection with hierarchy enabled', () => {
      const tagsCollection = payload.config.collections.find((c) => c.slug === tagsSlug)

      expect(tagsCollection).toBeDefined()
      expect(tagsCollection?.hierarchy).toBeDefined()
      expect(tagsCollection?.hierarchy).not.toBe(false)
    })

    it('should have parentFieldName in hierarchy config', () => {
      const tagsCollection = payload.config.collections.find((c) => c.slug === tagsSlug)
      expect(tagsCollection?.hierarchy).not.toBe(false)

      if (tagsCollection?.hierarchy !== false) {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(tagsCollection?.hierarchy).toHaveProperty('parentFieldName')
      }
    })

    it('should add parent field to tags collection', () => {
      const tagsCollection = payload.config.collections.find((c) => c.slug === tagsSlug)
      expect(tagsCollection?.hierarchy).not.toBe(false)

      if (tagsCollection?.hierarchy !== false) {
        const parentFieldName = tagsCollection?.hierarchy?.parentFieldName
        const parentField = tagsCollection?.fields.find(
          (f: any) => f.name === parentFieldName && f.type === 'relationship',
        )

        // eslint-disable-next-line vitest/no-conditional-expect
        expect(parentField).toBeDefined()
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(parentField).toMatchObject({
          type: 'relationship',
          hasMany: false,
          relationTo: tagsSlug,
        })
      }
    })

    it('should add virtual path fields', () => {
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
    it('should add tag relationship field to collection', () => {
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

    it('should configure hasMany based on helper options', () => {
      const postsCollection = payload.config.collections.find((c) => c.slug === postsSlug)
      const tagField = postsCollection?.fields.find(
        (f: any) => f.name === `_h_${tagsSlug}` && f.type === 'relationship',
      )

      expect((tagField as any)?.hasMany).toBe(true)
    })
  })
  describe('render-tab searchParams precedence', () => {
    const tabSlug = 'precedence-tab'

    const getForwardedSearchParams = ({
      query,
      searchParams,
    }: {
      query?: Record<string, unknown>
      searchParams?: Record<string, unknown>
    }): unknown => {
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

    it('should forward the provided searchParams to the rendered tab', () => {
      const forwarded = getForwardedSearchParams({
        query: { parent: 'from-query' },
        searchParams: { parent: 'from-args' },
      })

      expect(forwarded).toEqual({ parent: 'from-args' })
    })

    it('should fall back to req.query when searchParams is undefined', () => {
      const forwarded = getForwardedSearchParams({ query: { parent: 'from-query' } })

      expect(forwarded).toEqual({ parent: 'from-query' })
    })

    it('should use an explicitly empty searchParams object instead of falling back to req.query', () => {
      const forwarded = getForwardedSearchParams({
        query: { parent: 'from-query' },
        searchParams: {},
      })

      expect(forwarded).toEqual({})
    })
  })
})
