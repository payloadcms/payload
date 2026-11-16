import type { CollectionSlug } from 'payload'

import { slugifyHandler } from '@payloadcms/ui/utilities/slugify'
import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { test } from '../../../__helpers/int/vitest.js'
import { devUser } from '../../../credentials.js'
import {
  slugLocalizedRequiredNestedGroupSlug,
  slugLocalizedRequiredNestedTabSlug,
  slugLocalizedRequiredSiblingSlug,
  slugLocalizedRequiredSlug,
} from '../../slugs.js'

let user: any

test.suite('Slug fields', { config: '../../config.ts', resetBetweenTests: false }, () => {
  test.beforeAll(async ({ payloadInstance: payload, restClientInstance: restClient }) => {
    await restClient.login({
      slug: 'users',
      credentials: devUser,
    })
    user = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
      overrideAccess: true,
    })
  })

  test.describe('slug field', () => {
    const created: (number | string)[] = []

    test.afterEach(async ({ payload }) => {
      for (const id of created) {
        await payload.delete({ collection: 'slug-fields', id, overrideAccess: true })
      }
      created.length = 0
    })

    test('should generate a slug from the source field on create', async ({ payload }) => {
      const doc = await payload.create({
        collection: 'slug-fields',
        data: { title: 'My First Post' },
        overrideAccess: true,
      })
      created.push(doc.id)
      expect(doc.slug).toBe('my-first-post')
    })

    test('should keep a user-provided slug on create', async ({ payload }) => {
      const doc = await payload.create({
        collection: 'slug-fields',
        data: { title: 'My First Post', slug: 'custom-slug' },
        overrideAccess: true,
      })
      created.push(doc.id)
      expect(doc.slug).toBe('custom-slug')
    })

    test('should slugify an unnormalized explicit value', async ({ payload }) => {
      const doc = await payload.create({
        collection: 'slug-fields',
        data: { title: 'My First Post', slug: 'Hello World' },
        overrideAccess: true,
      })
      created.push(doc.id)
      expect(doc.slug).toBe('hello-world')
    })

    test('should freeze a diverged slug on update', async ({ payload }) => {
      const doc = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Original Title' },
        overrideAccess: true,
      })
      created.push(doc.id)

      const updated = await payload.update({
        collection: 'slug-fields',
        id: doc.id,
        data: { title: 'Changed Title', slug: 'manual-value' },
        overrideAccess: true,
      })
      expect(updated.slug).toBe('manual-value')

      const again = await payload.update({
        collection: 'slug-fields',
        id: doc.id,
        data: { title: 'Changed Title Again' },
        overrideAccess: true,
      })
      expect(again.slug).toBe('manual-value')
    })

    test('should fill every locale of a localized slug on create', async ({ payload }) => {
      const doc = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Title', localizedTitle: 'English Title' },
        locale: 'en',
        overrideAccess: true,
      })
      created.push(doc.id)
      expect(doc.localizedSlug).toBe('english-title')

      // The other locale is seeded on create so switching locales never lands on an empty slug —
      // with no source of its own it takes a `<singular>-N` fallback.
      const allLocales = await payload.findByID({
        collection: 'slug-fields',
        id: doc.id,
        locale: 'all',
        overrideAccess: true,
      })
      const localizedSlug = allLocales.localizedSlug as unknown as Record<string, string>
      expect(localizedSlug.en).toBe('english-title')
      expect(localizedSlug.es).toMatch(/^slug-field-\d+$/)
    })

    test('should derive every locale of a localized slug from a shared non-localized source', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Hello World' },
        locale: 'en',
        overrideAccess: true,
      })
      created.push(doc.id)

      // `title` is not localized, so its value applies to every locale — each derives `hello-world`
      // rather than falling back to the counter.
      const allLocales = await payload.findByID({
        collection: 'slug-fields',
        id: doc.id,
        locale: 'all',
        overrideAccess: true,
      })
      const shared = allLocales.localizedSharedSlug as unknown as Record<string, string>
      expect(shared.en).toBe('hello-world')
      expect(shared.es).toBe('hello-world')
    })

    test('should keep localized slugs independent when one locale is changed', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Title', localizedTitle: 'English Title' },
        locale: 'en',
        overrideAccess: true,
      })
      created.push(doc.id)

      // Changing one locale's slug leaves the others untouched (a slug is static once set).
      await payload.update({
        collection: 'slug-fields',
        id: doc.id,
        data: { localizedSlug: 'titulo-espanol' },
        locale: 'es',
        overrideAccess: true,
      })

      const allLocales = await payload.findByID({
        collection: 'slug-fields',
        id: doc.id,
        locale: 'all',
        overrideAccess: true,
      })
      const localizedSlug = allLocales.localizedSlug as unknown as Record<string, string>
      expect(localizedSlug.en).toBe('english-title')
      expect(localizedSlug.es).toBe('titulo-espanol')
    })

    test('should fall back to <singular>-N for a slug field with no useAsSlug source', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: 'slug-fields',
        data: { title: 'No Source' },
        overrideAccess: true,
      })
      created.push(doc.id)
      expect(doc.sourcelessSlug).toMatch(/^slug-field-\d+$/)
    })

    test('should keep an explicit value on a slug field with no useAsSlug source', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: 'slug-fields',
        data: { title: 'No Source', sourcelessSlug: 'Manual Value' },
        overrideAccess: true,
      })
      created.push(doc.id)
      expect(doc.sourcelessSlug).toBe('manual-value')
    })

    test('should allow the same localized slug value in different locales', async ({ payload }) => {
      const en = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Title', localizedSlug: 'shared' },
        locale: 'en',
        overrideAccess: true,
      })
      created.push(en.id)
      expect(en.localizedSlug).toBe('shared')

      const es = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Titulo', localizedSlug: 'shared' },
        locale: 'es',
        overrideAccess: true,
      })
      created.push(es.id)
      expect(es.localizedSlug).toBe('shared')
    })

    test('should allow one document to reuse the same slug across its own locales', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Title', localizedSlug: 'shared-across-self' },
        locale: 'en',
        overrideAccess: true,
      })
      created.push(doc.id)
      expect(doc.localizedSlug).toBe('shared-across-self')

      const es = await payload.update({
        collection: 'slug-fields',
        id: doc.id,
        data: { localizedSlug: 'shared-across-self' },
        locale: 'es',
        overrideAccess: true,
      })
      expect(es.localizedSlug).toBe('shared-across-self')

      const allLocales = await payload.findByID({
        collection: 'slug-fields',
        id: doc.id,
        locale: 'all',
        overrideAccess: true,
      })
      const localizedSlug = allLocales.localizedSlug as unknown as Record<string, string>
      expect(localizedSlug.en).toBe('shared-across-self')
      expect(localizedSlug.es).toBe('shared-across-self')
    })

    test('should reject a localized slug that collides within the same locale', async ({
      payload,
    }) => {
      const first = await payload.create({
        collection: 'slug-fields',
        data: { title: 'First', localizedSlug: 'shared-localized' },
        locale: 'es',
        overrideAccess: true,
      })
      created.push(first.id)
      expect(first.localizedSlug).toBe('shared-localized')

      await expect(
        payload.create({
          collection: 'slug-fields',
          data: { title: 'Second', localizedSlug: 'shared-localized' },
          locale: 'es',
          overrideAccess: true,
        }),
      ).rejects.toThrow()
    })

    test('should scope localized uniqueness per locale across documents', async ({ payload }) => {
      // Doc A: en `my-slug`, es `my-slugo`.
      const a = await payload.create({
        collection: 'slug-fields',
        data: { title: 'A', localizedSlug: 'my-slug' },
        locale: 'en',
        overrideAccess: true,
      })
      created.push(a.id)
      await payload.update({
        collection: 'slug-fields',
        id: a.id,
        data: { localizedSlug: 'my-slugo' },
        locale: 'es',
        overrideAccess: true,
      })

      // Doc B may take `my-slug` in es — it matches A's en value, but the es namespace is free.
      const b = await payload.create({
        collection: 'slug-fields',
        data: { title: 'B', localizedSlug: 'my-slug' },
        locale: 'es',
        overrideAccess: true,
      })
      created.push(b.id)

      const aLocales = (
        await payload.findByID({
          collection: 'slug-fields',
          id: a.id,
          locale: 'all',
          overrideAccess: true,
        })
      ).localizedSlug as unknown as Record<string, string>
      const bLocales = (
        await payload.findByID({
          collection: 'slug-fields',
          id: b.id,
          locale: 'all',
          overrideAccess: true,
        })
      ).localizedSlug as unknown as Record<string, string>
      expect(aLocales.en).toBe('my-slug')
      expect(aLocales.es).toBe('my-slugo')
      expect(bLocales.es).toBe('my-slug')

      // But B cannot take `my-slugo` in es — that collides with A within the es namespace.
      await expect(
        payload.create({
          collection: 'slug-fields',
          data: { title: 'C', localizedSlug: 'my-slugo' },
          locale: 'es',
          overrideAccess: true,
        }),
      ).rejects.toThrow()
    })

    test('should auto-increment a derived localized slug that collides within the same locale', async ({
      payload,
    }) => {
      const first = await payload.create({
        collection: 'slug-fields',
        data: { title: 'First', localizedTitle: 'Shared Derived' },
        locale: 'es',
        overrideAccess: true,
      })
      created.push(first.id)
      expect(first.localizedSlug).toBe('shared-derived')

      const second = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Second', localizedTitle: 'Shared Derived' },
        locale: 'es',
        overrideAccess: true,
      })
      created.push(second.id)
      expect(second.localizedSlug).toBe('shared-derived-1')
    })

    test('should not increment a derived localized slug shared across different locales', async ({
      payload,
    }) => {
      const en = await payload.create({
        collection: 'slug-fields',
        data: { title: 'English', localizedTitle: 'Cross Locale' },
        locale: 'en',
        overrideAccess: true,
      })
      created.push(en.id)
      expect(en.localizedSlug).toBe('cross-locale')

      const es = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Spanish', localizedTitle: 'Cross Locale' },
        locale: 'es',
        overrideAccess: true,
      })
      created.push(es.id)
      expect(es.localizedSlug).toBe('cross-locale')
    })

    test('should give a duplicate a fresh fallback slug instead of drifting from the original', async ({
      payload,
    }) => {
      const original = await payload.create({
        collection: 'slug-fields',
        data: { title: 'My First Post' },
        overrideAccess: true,
      })
      created.push(original.id)
      expect(original.slug).toBe('my-first-post')

      const duplicate = await payload.duplicate({
        collection: 'slug-fields',
        id: original.id,
        overrideAccess: true,
      })
      created.push(duplicate.id)

      // The copy takes a fresh `<singular>-N` fallback, not `my-first-post-1`.
      expect(duplicate.slug).toBe('slug-field-1')

      const secondDuplicate = await payload.duplicate({
        collection: 'slug-fields',
        id: original.id,
        overrideAccess: true,
      })
      created.push(secondDuplicate.id)
      expect(secondDuplicate.slug).toBe('slug-field-2')
    })

    test('should derive from the source when an explicit value slugifies to nothing', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Fallthrough Title', slug: '!!!' },
        overrideAccess: true,
      })
      created.push(doc.id)
      expect(doc.slug).toBe('fallthrough-title')
    })

    test('should reject a slug that collides with another document', async ({ payload }) => {
      const first = await payload.create({
        collection: 'slug-fields',
        data: { title: 'First', slug: 'shared-slug' },
        overrideAccess: true,
      })
      created.push(first.id)
      expect(first.slug).toBe('shared-slug')

      await expect(
        payload.create({
          collection: 'slug-fields',
          data: { title: 'Second', slug: 'shared-slug' },
          overrideAccess: true,
        }),
      ).rejects.toThrow()
    })

    test('should reject updating a slug to collide with another document', async ({ payload }) => {
      const a = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Doc A', slug: 'doc-a' },
        overrideAccess: true,
      })
      created.push(a.id)
      const b = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Doc B', slug: 'doc-b' },
        overrideAccess: true,
      })
      created.push(b.id)

      await expect(
        payload.update({
          collection: 'slug-fields',
          id: b.id,
          data: { slug: 'doc-a' },
          overrideAccess: true,
        }),
      ).rejects.toThrow()
    })

    test('should allow re-saving a document with its own unchanged slug', async ({ payload }) => {
      const doc = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Stable', slug: 'stable-slug' },
        overrideAccess: true,
      })
      created.push(doc.id)

      // Autosave resends the current slug on every tick — re-saving the same value must not trip the
      // collision check against the document itself.
      const updated = await payload.update({
        collection: 'slug-fields',
        id: doc.id,
        data: { slug: 'stable-slug' },
        overrideAccess: true,
      })
      expect(updated.slug).toBe('stable-slug')
    })

    // The regen button calls the slugify server function directly, which has its own fallback path
    // separate from the beforeChange hook. It must scope the source-less `<singular>-N` fallback to
    // the active locale, or it hands back a slug already taken in that locale.
    test('should regenerate a source-less localized slug to a locale-unique fallback', async ({
      payload,
    }) => {
      const taken = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Taken' },
        locale: 'es',
        overrideAccess: true,
      })
      created.push(taken.id)
      const takenSlug = taken.localizedSlug as string
      expect(takenSlug).toMatch(/^slug-field-\d+$/)

      const req = await createPayloadRequest({ payload, user: user.user })

      const regenerated = await slugifyHandler({
        collectionSlug: 'slug-fields',
        data: {},
        locale: 'es',
        path: 'localizedSlug',
        req,
        valueToSlugify: '',
      })

      expect(regenerated).toMatch(/^slug-field-\d+$/)
      expect(regenerated).not.toBe(takenSlug)
    })

    test('should dedupe a source-derived slug on regenerate, matching the next save', async ({
      payload,
    }) => {
      const first = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Shared Regen' },
        overrideAccess: true,
      })
      created.push(first.id)
      expect(first.slug).toBe('shared-regen')

      const req = await createPayloadRequest({ payload, user: user.user })

      // Regenerating from a source that slugifies to a taken slug must bump it, not hand back the
      // duplicate — otherwise the next save throws a uniqueness error.
      const regenerated = await slugifyHandler({
        collectionSlug: 'slug-fields',
        data: {},
        path: 'slug',
        req,
        valueToSlugify: 'Shared Regen',
      })

      expect(regenerated).toBe('shared-regen-1')
    })

    test('should let a document reuse its own slug on regenerate via the excluded id', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: 'slug-fields',
        data: { title: 'Own Slug' },
        overrideAccess: true,
      })
      created.push(doc.id)
      expect(doc.slug).toBe('own-slug')

      const req = await createPayloadRequest({ payload, user: user.user })

      // Excluding the current doc means regenerating its own unchanged source reuses the value rather
      // than bumping past test.
      const regenerated = await slugifyHandler({
        id: doc.id,
        collectionSlug: 'slug-fields',
        data: {},
        path: 'slug',
        req,
        valueToSlugify: 'Own Slug',
      })

      expect(regenerated).toBe('own-slug')
    })

    test.describe('autosave drafts', () => {
      const created: (number | string)[] = []

      test.afterEach(async ({ payload }) => {
        for (const id of created) {
          await payload.delete({ collection: 'slug-autosave', id, overrideAccess: true })
        }
        created.length = 0
      })

      test('should generate the slug from the source on a draft create', async ({ payload }) => {
        const draft = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: { title: 'Draft One' },
          overrideAccess: true,
        })
        created.push(draft.id)
        expect(draft.slug).toBe('draft-one')
      })

      test('should fall back to <singular>-N when a draft is created with no source', async ({
        payload,
      }) => {
        const draft = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: {},
          overrideAccess: true,
        })
        created.push(draft.id)
        expect(draft.slug).toBe('slug-autosave-1')

        // The admin reads the latest draft version, not the create response, so the fallback must
        // be persisted there too.
        const latestDraft = await payload.findByID({
          collection: 'slug-autosave',
          id: draft.id,
          draft: true,
          overrideAccess: true,
        })
        expect(latestDraft.slug).toBe('slug-autosave-1')
      })

      test('should fall back when the explicit value slugifies to nothing and there is no source', async ({
        payload,
      }) => {
        const draft = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: { slug: '!!!' },
          overrideAccess: true,
        })
        created.push(draft.id)
        expect(draft.slug).toBe('slug-autosave-1')
      })

      test('should give each source-less draft the next fallback without colliding', async ({
        payload,
      }) => {
        const first = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: {},
          overrideAccess: true,
        })
        created.push(first.id)

        const second = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: {},
          overrideAccess: true,
        })
        created.push(second.id)

        expect(first.slug).toBe('slug-autosave-1')
        expect(second.slug).toBe('slug-autosave-2')
      })

      test('should reject a draft slug that collides with another draft', async ({ payload }) => {
        const first = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: { title: 'First', slug: 'shared-draft-slug' },
          overrideAccess: true,
        })
        created.push(first.id)
        expect(first.slug).toBe('shared-draft-slug')

        await expect(
          payload.create({
            collection: 'slug-autosave',
            draft: true,
            data: { title: 'Second', slug: 'shared-draft-slug' },
            overrideAccess: true,
          }),
        ).rejects.toThrow()
      })

      test('should reject updating a draft slug to collide with another draft', async ({
        payload,
      }) => {
        const a = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: { title: 'A', slug: 'draft-a' },
          overrideAccess: true,
        })
        created.push(a.id)
        const b = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: { title: 'B', slug: 'draft-b' },
          overrideAccess: true,
        })
        created.push(b.id)

        await expect(
          payload.update({
            collection: 'slug-autosave',
            id: b.id,
            draft: true,
            data: { slug: 'draft-a' },
            overrideAccess: true,
          }),
        ).rejects.toThrow()
      })

      test('should allow the same localized draft slug across locales but reject within a locale', async ({
        payload,
      }) => {
        const en = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: { localizedTitle: 'One', localizedSlug: 'shared-draft-localized' },
          locale: 'en',
          overrideAccess: true,
        })
        created.push(en.id)
        expect(en.localizedSlug).toBe('shared-draft-localized')

        // Same value in a different locale is fine — uniqueness is per-locale.
        const es = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: { localizedTitle: 'Uno', localizedSlug: 'shared-draft-localized' },
          locale: 'es',
          overrideAccess: true,
        })
        created.push(es.id)
        expect(es.localizedSlug).toBe('shared-draft-localized')

        // Same value in the same locale collides.
        await expect(
          payload.create({
            collection: 'slug-autosave',
            draft: true,
            data: { localizedTitle: 'Two', localizedSlug: 'shared-draft-localized' },
            locale: 'en',
            overrideAccess: true,
          }),
        ).rejects.toThrow()
      })

      test('should fall back to <singular>-N for a source-less localized slug on a draft', async ({
        payload,
      }) => {
        const draft = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: {},
          locale: 'en',
          overrideAccess: true,
        })
        created.push(draft.id)
        expect(draft.localizedSlug).toBe('slug-autosave-1')

        // The fallback must persist to the draft version the admin reads back, and survive publish.
        const latestDraft = await payload.findByID({
          collection: 'slug-autosave',
          id: draft.id,
          draft: true,
          locale: 'en',
          overrideAccess: true,
        })
        expect(latestDraft.localizedSlug).toBe('slug-autosave-1')

        const published = await payload.update({
          collection: 'slug-autosave',
          id: draft.id,
          data: { _status: 'published' },
          locale: 'en',
          overrideAccess: true,
        })
        expect(published.localizedSlug).toBe('slug-autosave-1')
      })

      test('should fill every locale of a localized slug on a draft create', async ({
        payload,
      }) => {
        const draft = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: {},
          locale: 'en',
          overrideAccess: true,
        })
        created.push(draft.id)

        const allLocales = await payload.findByID({
          collection: 'slug-autosave',
          id: draft.id,
          draft: true,
          locale: 'all',
          overrideAccess: true,
        })
        const localizedSlug = allLocales.localizedSlug as unknown as Record<string, string>
        expect(localizedSlug.en).toMatch(/^slug-autosave-\d+$/)
        expect(localizedSlug.es).toMatch(/^slug-autosave-\d+$/)
      })

      test('should fall back to a per-locale <singular>-N for localized slugs on a draft', async ({
        payload,
      }) => {
        const en = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: {},
          locale: 'en',
          overrideAccess: true,
        })
        created.push(en.id)
        expect(en.localizedSlug).toBe('slug-autosave-1')

        // A different locale falls back independently — the counter is scoped per-locale.
        const es = await payload.update({
          collection: 'slug-autosave',
          id: en.id,
          draft: true,
          data: {},
          locale: 'es',
          overrideAccess: true,
        })
        expect(es.localizedSlug).toBe('slug-autosave-1')
      })

      test('should give a duplicated draft its own unique slug', async ({ payload }) => {
        const original = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: { title: 'Dup Me', slug: 'dup-me' },
          overrideAccess: true,
        })
        created.push(original.id)
        expect(original.slug).toBe('dup-me')

        const duplicate = await payload.duplicate({
          collection: 'slug-autosave',
          id: original.id,
          overrideAccess: true,
        })
        created.push(duplicate.id)

        expect(duplicate.slug).not.toBe('dup-me')
        expect(duplicate.slug).toMatch(/^slug-autosave-\d+$/)
      })

      test('should keep an explicit slug the user typed on the initial draft', async ({
        payload,
      }) => {
        const draft = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: { title: 'Draft One', slug: 'user-typed' },
          overrideAccess: true,
        })
        created.push(draft.id)
        expect(draft.slug).toBe('user-typed')
      })

      test('should freeze the slug across subsequent autosaves once set', async ({ payload }) => {
        const draft = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: { title: 'Draft One' },
          overrideAccess: true,
        })
        created.push(draft.id)
        expect(draft.slug).toBe('draft-one')

        const updated = await payload.update({
          collection: 'slug-autosave',
          id: draft.id,
          draft: true,
          data: { title: 'Draft One Updated' },
          overrideAccess: true,
        })
        expect(updated.slug).toBe('draft-one')
      })

      test('should keep an admin overwrite across subsequent autosaves', async ({ payload }) => {
        const draft = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: { title: 'Draft One' },
          overrideAccess: true,
        })
        created.push(draft.id)

        await payload.update({
          collection: 'slug-autosave',
          id: draft.id,
          draft: true,
          data: { title: 'Draft Two' },
          overrideAccess: true,
        })

        const overwritten = await payload.update({
          collection: 'slug-autosave',
          id: draft.id,
          draft: true,
          data: { slug: 'human-chosen-slug' },
          overrideAccess: true,
        })
        expect(overwritten.slug).toBe('human-chosen-slug')

        const afterMoreEdits = await payload.update({
          collection: 'slug-autosave',
          id: draft.id,
          draft: true,
          data: { title: 'Draft Three' },
          overrideAccess: true,
        })
        expect(afterMoreEdits.slug).toBe('human-chosen-slug')
      })

      test('should not change an already-set slug on publish or after', async ({ payload }) => {
        const draft = await payload.create({
          collection: 'slug-autosave',
          draft: true,
          data: { title: 'Draft One' },
          overrideAccess: true,
        })
        created.push(draft.id)
        expect(draft.slug).toBe('draft-one')

        await payload.update({
          collection: 'slug-autosave',
          id: draft.id,
          draft: true,
          data: { title: 'Publishable Title' },
          overrideAccess: true,
        })

        const published = await payload.update({
          collection: 'slug-autosave',
          id: draft.id,
          data: { _status: 'published', title: 'Publishable Title' },
          overrideAccess: true,
        })
        expect(published.slug).toBe('draft-one')

        const afterPublish = await payload.update({
          collection: 'slug-autosave',
          id: draft.id,
          data: { _status: 'published', title: 'Title Changed After Publish' },
          overrideAccess: true,
        })
        expect(afterPublish.slug).toBe('draft-one')
      })
    })
  })

  test.describe('slug field read access', () => {
    const collection = 'slug-field-access'
    const created: (number | string)[] = []

    test.afterEach(async ({ payload }) => {
      for (const id of created) {
        await payload.delete({ collection, id, overrideAccess: true })
      }
      created.length = 0
    })

    test('should apply read access when a REST create omits overrideAccess', async ({
      payload,
      restClient,
    }) => {
      const hidden = await payload.create({
        collection,
        data: { title: 'REST shared title' },
        overrideAccess: true,
      })
      created.push(hidden.id)

      const response = await restClient.POST(`/${collection}`, {
        body: JSON.stringify({ title: 'REST shared title' }),
      })
      const { doc } = await response.json()
      created.push(doc.id)

      expect(response.status).toBe(201)
      expect(doc.slug).toBe('rest-shared-title')
    })

    test('should apply read access when checking a generated slug during create', async ({
      payload,
    }) => {
      const hidden = await payload.create({
        collection,
        data: { title: 'Shared title' },
        overrideAccess: true,
      })
      created.push(hidden.id)

      const req = await createPayloadRequest({ payload, user: user.user })
      const createdWithAccess = await payload.create({
        collection,
        data: { title: 'Shared title' },
        overrideAccess: false,
        req,
      })
      created.push(createdWithAccess.id)

      expect(createdWithAccess.slug).toBe('shared-title')
    })

    test('should apply read access when checking an explicit slug during update', async ({
      payload,
    }) => {
      const hidden = await payload.create({
        collection,
        data: { slug: 'shared-slug', title: 'Hidden' },
        overrideAccess: true,
      })
      const editable = await payload.create({
        collection,
        data: { slug: 'editable-slug', title: 'Editable' },
        overrideAccess: true,
      })
      created.push(hidden.id, editable.id)

      const req = await createPayloadRequest({ payload, user: user.user })
      const updated = await payload.update({
        collection,
        id: editable.id,
        data: { slug: 'shared-slug' },
        overrideAccess: false,
        req,
      })

      expect(updated.slug).toBe('shared-slug')
    })

    test('should apply read access while filling localized slugs', async ({ payload }) => {
      const hidden = await payload.create({
        collection,
        data: { localizedTitle: 'Localized title', title: 'Hidden' },
        locale: 'en',
        overrideAccess: true,
      })
      created.push(hidden.id)

      const req = await createPayloadRequest({ payload, user: user.user })
      const createdWithAccess = await payload.create({
        collection,
        data: { localizedTitle: 'Localized title', title: 'Visible' },
        locale: 'en',
        overrideAccess: false,
        req,
      })
      created.push(createdWithAccess.id)

      const allLocales = await payload.findByID({
        collection,
        id: createdWithAccess.id,
        locale: 'all',
        overrideAccess: true,
      })
      const hiddenLocales = await payload.findByID({
        collection,
        id: hidden.id,
        locale: 'all',
        overrideAccess: true,
      })
      const localizedSlug = allLocales.localizedSlug as unknown as Record<string, string>
      const hiddenLocalizedSlug = hiddenLocales.localizedSlug as unknown as Record<string, string>

      expect(localizedSlug.en).toBe('localized-title')
      expect(localizedSlug.es).toBe(hiddenLocalizedSlug.es)
    })

    test('should apply read access when choosing a source-less fallback', async ({ payload }) => {
      const hidden = await payload.create({
        collection,
        data: { title: 'Hidden' },
        overrideAccess: true,
      })
      created.push(hidden.id)

      const req = await createPayloadRequest({ payload, user: user.user })
      const createdWithAccess = await payload.create({
        collection,
        data: { title: 'Visible' },
        overrideAccess: false,
        req,
      })
      created.push(createdWithAccess.id)

      expect(createdWithAccess.sourcelessSlug).toBe(hidden.sourcelessSlug)
    })

    test('should retain elevated slug probes for explicitly elevated Local API creates', async ({
      payload,
    }) => {
      const hidden = await payload.create({
        collection,
        data: { title: 'Shared title' },
        overrideAccess: true,
      })
      created.push(hidden.id)

      const elevated = await payload.create({
        collection,
        data: { title: 'Shared title' },
        overrideAccess: true,
      })
      created.push(elevated.id)

      expect(elevated.slug).toBe('shared-title-1')
    })
  })

  test.describe('localized slugs with required localized fields', () => {
    const createdDocuments: { collection: CollectionSlug; id: number | string }[] = []

    test.afterEach(async ({ payload }) => {
      for (const { collection, id } of createdDocuments) {
        await payload.delete({ collection, id, overrideAccess: true })
      }
      createdDocuments.length = 0
    })

    for (const locale of ['en', 'es'] as const) {
      test(`should create in ${locale} before translating the required title`, async ({
        payload,
      }) => {
        const otherLocale = locale === 'en' ? 'es' : 'en'
        const created = await payload.create({
          collection: slugLocalizedRequiredSlug,
          data: { slug: '', title: 'First translation' },
          locale,
          overrideAccess: true,
        })
        createdDocuments.push({ collection: slugLocalizedRequiredSlug, id: created.id })

        expect(created).toMatchObject({ slug: 'first-translation', title: 'First translation' })

        const untranslated = await payload.findByID({
          id: created.id,
          collection: slugLocalizedRequiredSlug,
          fallbackLocale: false,
          locale: otherLocale,
          overrideAccess: true,
        })

        expect(untranslated.title ?? null).toBeNull()
        expect(untranslated.slug ?? null).toBeNull()

        const translated = await payload.update({
          id: created.id,
          collection: slugLocalizedRequiredSlug,
          data: { title: 'Second translation' },
          fallbackLocale: false,
          locale: otherLocale,
          overrideAccess: true,
        })

        expect(translated).toMatchObject({
          slug: 'second-translation',
          title: 'Second translation',
        })

        const originalLocale = await payload.findByID({
          id: created.id,
          collection: slugLocalizedRequiredSlug,
          fallbackLocale: false,
          locale,
          overrideAccess: true,
        })

        expect(originalLocale).toMatchObject({
          slug: 'first-translation',
          title: 'First translation',
        })
      })
    }

    test('should defer shared, optional, and sourceless slugs until a required sibling is translated', async ({
      payload,
    }) => {
      const locale = 'en'
      const otherLocale = 'es'
      const created = await payload.create({
        collection: slugLocalizedRequiredSiblingSlug,
        data: { title: 'Shared title', optionalTitle: 'First title', body: 'First body' },
        locale,
        overrideAccess: true,
      })
      createdDocuments.push({ collection: slugLocalizedRequiredSiblingSlug, id: created.id })

      expect(created).toMatchObject({ sharedSlug: 'shared-title', optionalSlug: 'first-title' })
      expect(created.fallbackSlug).toBeTruthy()

      const untranslated = await payload.findByID({
        collection: slugLocalizedRequiredSiblingSlug,
        id: created.id,
        locale: otherLocale,
        fallbackLocale: false,
        overrideAccess: true,
      })

      for (const field of ['body', 'sharedSlug', 'optionalSlug', 'fallbackSlug'] as const) {
        expect(untranslated[field] ?? null).toBeNull()
      }

      const translated = await payload.update({
        collection: slugLocalizedRequiredSiblingSlug,
        id: created.id,
        data: { body: 'Second body', optionalTitle: 'Second title' },
        locale: otherLocale,
        fallbackLocale: false,
        overrideAccess: true,
      })

      expect(translated).toMatchObject({ sharedSlug: 'shared-title', optionalSlug: 'second-title' })
      expect(translated.fallbackSlug).toBeTruthy()

      const originalLocale = await payload.findByID({
        collection: slugLocalizedRequiredSiblingSlug,
        id: created.id,
        locale,
        fallbackLocale: false,
        overrideAccess: true,
      })

      expect(originalLocale).toMatchObject({
        body: 'First body',
        sharedSlug: created.sharedSlug,
        optionalSlug: created.optionalSlug,
        fallbackSlug: created.fallbackSlug,
      })
    })

    for (const collection of [
      slugLocalizedRequiredNestedGroupSlug,
      slugLocalizedRequiredNestedTabSlug,
    ] as const) {
      test(`should defer top-level slugs until a required nested slug in ${collection} is translated`, async ({
        payload,
      }) => {
        const locale = 'en'
        const otherLocale = 'es'
        const created = await payload.create({
          collection,
          data: { title: 'Shared title', content: { slug: 'First nested slug' } },
          locale,
          overrideAccess: true,
        })
        createdDocuments.push({ collection, id: created.id })

        expect(created).toMatchObject({
          slug: 'shared-title',
          content: { slug: 'first-nested-slug' },
        })

        const untranslated = await payload.findByID({
          collection,
          id: created.id,
          locale: otherLocale,
          fallbackLocale: false,
          overrideAccess: true,
        })

        expect(untranslated.slug ?? null).toBeNull()
        expect(untranslated.content?.slug ?? null).toBeNull()

        const translated = await payload.update({
          collection,
          id: created.id,
          data: { content: { slug: 'Second nested slug' } },
          locale: otherLocale,
          fallbackLocale: false,
          overrideAccess: true,
        })

        expect(translated).toMatchObject({
          slug: 'shared-title',
          content: { slug: 'second-nested-slug' },
        })

        const originalLocale = await payload.findByID({
          collection,
          id: created.id,
          locale,
          fallbackLocale: false,
          overrideAccess: true,
        })

        expect(originalLocale).toMatchObject({
          slug: created.slug,
          content: { slug: created.content?.slug },
        })
      })
    }
  })
})
