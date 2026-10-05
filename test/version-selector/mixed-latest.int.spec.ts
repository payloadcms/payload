/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Integration tests use the shared fixture wrapper. */
import { beginTransaction } from '@payloadcms/drizzle'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { draftGlobalSlug, localizedPostsSlug } from './slugs.js'

test.suite('Mixed locale latest writes', { config: './config.ts' }, () => {
  let previousRequired: boolean | undefined

  test.beforeEach(({ payload }) => {
    const title = payload.collections[localizedPostsSlug].config.fields.find(
      (field) => 'name' in field && field.name === 'title',
    )!

    previousRequired = title.required
    title.required = true
  })

  test.afterEach(({ payload }) => {
    const title = payload.collections[localizedPostsSlug].config.fields.find(
      (field) => 'name' in field && field.name === 'title',
    )!

    title.required = previousRequired
  })

  test('should validate pending rich-text block fields when a status hook publishes the locale', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: localizedPostsSlug,
      data: { title: { en: 'English', fr: 'French' } },
      locale: 'all',
      version: 'published',
    })
    const target = { id: created.id, collection: localizedPostsSlug }

    await payload.update({
      version: 'draft',
      ...target,
      data: {
        richText: {
          root: {
            type: 'root',
            children: [
              { type: 'block', fields: { blockType: 'myBlock', someTextRequired: '' }, version: 2 },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
      },
    })
    const status = payload.collections[localizedPostsSlug].config.fields.find(
      (field) => 'name' in field && field.name === '_status',
    )!
    const previousHooks = status.hooks

    status.hooks = { ...previousHooks, beforeChange: [() => 'published'] }
    try {
      await expect(
        payload.update({ ...target, data: {}, locale: 'all', version: 'latest' }),
      ).rejects.toThrow(/Rich Text/)
    } finally {
      status.hooks = previousHooks
    }
  })

  for (const isGlobal of [false, true]) {
    for (const isInvalid of [true, false]) {
      test(`should ${isInvalid ? 'reject invalid' : 'publish valid'} pending content when a ${isGlobal ? 'global' : 'collection'} field hook publishes it`, async ({
        payload,
      }) => {
        const initialData = { title: { en: 'Live English', fr: 'Live French' } }
        const created = isGlobal
          ? await payload.updateGlobal({
              slug: draftGlobalSlug,
              data: { ...initialData, _status: 'published' },
              locale: 'all',
              version: 'draft',
            })
          : await payload.create({
              collection: localizedPostsSlug,
              data: initialData,
              locale: 'all',
              version: 'published',
            })
        const target = { id: created.id, collection: localizedPostsSlug }
        const pendingTitle = isInvalid ? '' : 'Pending English'

        if (isGlobal) {
          await payload.updateGlobal({
            slug: draftGlobalSlug,
            data: { title: pendingTitle },
            version: 'draft',
          })
        } else {
          await payload.update({ ...target, data: { title: pendingTitle }, version: 'draft' })
        }
        const config = isGlobal
          ? payload.globals.config.find((global) => global.slug === draftGlobalSlug)!
          : payload.collections[localizedPostsSlug].config
        const status = config.fields.find((field) => 'name' in field && field.name === '_status')!
        const previousHooks = status.hooks
        let hookCalls = 0

        status.hooks = {
          ...previousHooks,
          beforeChange: [
            () => {
              hookCalls++
              return 'published'
            },
          ],
        }
        try {
          const operation = isGlobal
            ? payload.updateGlobal({
                slug: draftGlobalSlug,
                data: {},
                locale: 'all',
                version: 'latest',
              })
            : payload.update({ ...target, data: {}, locale: 'all', version: 'latest' })

          if (isInvalid) {
            await expect(operation).rejects.toThrow(/Title/)
            expect(hookCalls).toBe(1)
          } else {
            await operation
            expect(hookCalls).toBe(2)
          }
          const published = isGlobal
            ? await payload.findGlobal({ slug: draftGlobalSlug, locale: 'all' })
            : await payload.findByID({ ...target, locale: 'all' })

          expect(published.title.en).toBe(isInvalid ? 'Live English' : pendingTitle)
        } finally {
          status.hooks = previousHooks
        }
      })
    }
  }

  for (const isGlobal of [false, true]) {
    for (const isStatusMap of [false, true]) {
      test(`should validate pending required fields before publishing ${isGlobal ? 'globals' : 'collections'} with ${isStatusMap ? 'a status map' : 'scalar status'}`, async ({
        payload,
      }) => {
        const initialData = { title: { en: 'Live English', fr: 'Live French' } }
        const created = isGlobal
          ? await payload.updateGlobal({
              slug: draftGlobalSlug,
              data: { ...initialData, _status: 'published' },
              locale: 'all',
              version: 'draft',
            })
          : await payload.create({
              collection: localizedPostsSlug,
              data: initialData,
              locale: 'all',
              version: 'published',
            })
        const target = { id: created.id, collection: localizedPostsSlug }

        if (isGlobal) {
          await payload.updateGlobal({
            slug: draftGlobalSlug,
            data: { title: '' },
            locale: 'en',
            version: 'draft',
          })
        } else {
          await payload.update({ ...target, data: { title: '' }, locale: 'en', version: 'draft' })
        }
        const data = { _status: isStatusMap ? { en: 'published', fr: 'published' } : 'published' }

        await expect(
          isGlobal
            ? payload.updateGlobal({
                slug: draftGlobalSlug,
                data,
                locale: 'all',
                version: 'latest',
              })
            : payload.update({ ...target, data, locale: 'all', version: 'latest' }),
        ).rejects.toThrow(/Title/)
        const published = isGlobal
          ? await payload.findGlobal({ slug: draftGlobalSlug, locale: 'all' })
          : await payload.findByID({ ...target, locale: 'all' })

        expect(published.title).toEqual(initialData.title)
      })
    }
  }

  for (const isGlobal of [false, true]) {
    test.options(
      `should roll back both copies when ${isGlobal ? 'global' : 'collection'} version persistence fails`,
      { db: (adapter) => adapter === 'sqlite' },
      async ({ payload }) => {
        const initialData = { title: { en: 'Live English', fr: 'Live French' } }
        const created = isGlobal
          ? await payload.updateGlobal({
              slug: draftGlobalSlug,
              data: { ...initialData, _status: 'published' },
              locale: 'all',
              version: 'draft',
            })
          : await payload.create({
              collection: localizedPostsSlug,
              data: initialData,
              locale: 'all',
              version: 'published',
            })
        const target = { id: created.id, collection: localizedPostsSlug }

        if (isGlobal) {
          await payload.updateGlobal({
            slug: draftGlobalSlug,
            data: { title: 'Pending English' },
            version: 'draft',
          })
        } else {
          await payload.update({ ...target, data: { title: 'Pending English' }, version: 'draft' })
        }

        const previousBeginTransaction = payload.db.beginTransaction
        const method = isGlobal ? 'createGlobalVersion' : 'createVersion'
        const previousCreateVersion = payload.db[method]

        payload.db.beginTransaction = beginTransaction
        payload.db[method] = () => Promise.reject(new Error('Rejected version persistence'))
        try {
          const data = { title: { en: 'Rejected English', fr: 'Rejected French' } }

          await expect(
            isGlobal
              ? payload.updateGlobal({
                  slug: draftGlobalSlug,
                  data,
                  locale: 'all',
                  version: 'latest',
                })
              : payload.update({ ...target, data, locale: 'all', version: 'latest' }),
          ).rejects.toThrow('Rejected version persistence')
          const latest = isGlobal
            ? await payload.findGlobal({ slug: draftGlobalSlug, locale: 'all', version: 'latest' })
            : await payload.findByID({ ...target, locale: 'all', version: 'latest' })
          const published = isGlobal
            ? await payload.findGlobal({ slug: draftGlobalSlug, locale: 'all' })
            : await payload.findByID({ ...target, locale: 'all' })

          expect(latest.title).toEqual({ en: 'Pending English', fr: 'Live French' })
          expect(published.title).toEqual(initialData.title)
        } finally {
          payload.db.beginTransaction = previousBeginTransaction
          payload.db[method] = previousCreateVersion
        }
      },
    )
  }

  for (const isGlobal of [false, true]) {
    for (const isPartial of [false, true]) {
      test(`should update ${isPartial ? 'a submitted published locale' : 'each locale'} against its latest starting copy in ${isGlobal ? 'globals' : 'collections'}`, async ({
        payload,
      }) => {
        const initialData = {
          summary: 'Live summary',
          title: { en: 'Live English', fr: 'Live French' },
        }
        const created = isGlobal
          ? await payload.updateGlobal({
              slug: draftGlobalSlug,
              data: { ...initialData, _status: 'published' },
              locale: 'all',
              version: 'draft',
            })
          : await payload.create({
              collection: localizedPostsSlug,
              data: initialData,
              locale: 'all',
              version: 'published',
            })
        const target = { id: created.id, collection: localizedPostsSlug }

        if (isGlobal) {
          await payload.updateGlobal({
            slug: draftGlobalSlug,
            data: { title: 'Pending English' },
            locale: 'en',
            version: 'draft',
          })
        } else {
          await payload.update({
            ...target,
            data: { title: 'Pending English' },
            locale: 'en',
            version: 'draft',
          })
        }

        const data = {
          summary: 'Pending summary',
          title: isPartial
            ? { fr: 'Edited French' }
            : { en: 'Edited English', fr: 'Edited French' },
        }
        const updated = isGlobal
          ? await payload.updateGlobal({
              slug: draftGlobalSlug,
              data,
              locale: 'all',
              version: 'latest',
            })
          : await payload.update({ ...target, data, locale: 'all', version: 'latest' })
        const latest = isGlobal
          ? await payload.findGlobal({ slug: draftGlobalSlug, locale: 'all', version: 'latest' })
          : await payload.findByID({ ...target, locale: 'all', version: 'latest' })
        const published = isGlobal
          ? await payload.findGlobal({ slug: draftGlobalSlug, locale: 'all' })
          : await payload.findByID({ ...target, locale: 'all' })

        expect(updated.title).toEqual({
          en: isPartial ? 'Pending English' : 'Edited English',
          fr: 'Edited French',
        })
        expect(latest.title).toEqual(updated.title)
        expect(latest._status).toEqual({ en: 'draft', fr: 'published' })
        expect(published.title).toEqual({ en: 'Live English', fr: 'Edited French' })
        expect(published.summary).toBe('Live summary')
        expect(latest.summary).toBe('Pending summary')
      })
    }
  }

  test('should persist mixed locale latest edits through bulk collection updates', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: localizedPostsSlug,
      data: { title: { en: 'Live English', fr: 'Live French' } },
      locale: 'all',
      version: 'published',
    })

    await payload.update({
      id: created.id,
      collection: localizedPostsSlug,
      data: { title: 'Pending English' },
      locale: 'en',
      version: 'draft',
    })
    const updated = await payload.update({
      collection: localizedPostsSlug,
      data: { title: { en: 'Edited English', fr: 'Edited French' } },
      locale: 'all',
      version: 'latest',
      where: { id: { equals: created.id } },
    })
    const published = await payload.findByID({
      id: created.id,
      collection: localizedPostsSlug,
      locale: 'all',
    })

    expect(updated.errors).toEqual([])
    expect(published.title).toEqual({ en: 'Live English', fr: 'Edited French' })
    expect(
      (
        await payload.find({
          collection: localizedPostsSlug,
          locale: 'fr',
          version: 'latest',
          where: { title: { equals: 'Edited French' } },
        })
      ).totalDocs,
    ).toBe(1)
  })

  test('should merge nested locale edits without publishing shared pending fields', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: localizedPostsSlug,
      data: {
        details: { heading: { en: 'Live heading', fr: 'Titre' }, note: 'Live note' },
        rows: [{ label: { en: 'Live row', fr: 'Ligne' }, note: 'Live row note' }],
        title: { en: 'Live English', fr: 'Live French' },
      },
      locale: 'all',
      version: 'published',
    })

    await payload.update({
      id: created.id,
      collection: localizedPostsSlug,
      data: { title: 'Pending English' },
      locale: 'en',
      version: 'draft',
    })
    await payload.update({
      id: created.id,
      collection: localizedPostsSlug,
      data: {
        details: { heading: { en: 'Edited heading', fr: 'Titre modifié' }, note: 'Pending note' },
        rows: [
          {
            id: created.rows[0].id,
            label: { en: 'Edited row', fr: 'Ligne modifiée' },
            note: 'Pending row note',
          },
        ],
      },
      locale: 'all',
      version: 'latest',
    })
    const published = await payload.findByID({
      id: created.id,
      collection: localizedPostsSlug,
      locale: 'all',
    })
    const latest = await payload.findByID({
      id: created.id,
      collection: localizedPostsSlug,
      locale: 'all',
      version: 'latest',
    })

    expect(published.details).toMatchObject({
      heading: { en: 'Live heading', fr: 'Titre modifié' },
      note: 'Live note',
    })
    expect(published.rows[0]).toMatchObject({
      label: { en: 'Live row', fr: 'Ligne modifiée' },
      note: 'Live row note',
    })
    expect(latest.details).toMatchObject({
      heading: { en: 'Edited heading', fr: 'Titre modifié' },
      note: 'Pending note',
    })
  })

  test('should validate a published locale during a mixed latest write', async ({ payload }) => {
    await payload.updateGlobal({
      slug: draftGlobalSlug,
      data: { _status: 'published', title: { en: 'Live English', fr: 'Live French' } },
      locale: 'all',
      version: 'draft',
    })
    await payload.updateGlobal({
      slug: draftGlobalSlug,
      data: { title: 'Pending English' },
      locale: 'en',
      version: 'draft',
    })

    await expect(
      payload.updateGlobal({
        slug: draftGlobalSlug,
        data: { title: { en: '', fr: '' } },
        locale: 'all',
        version: 'latest',
      }),
    ).rejects.toMatchObject({ status: 400 })
    expect((await payload.findGlobal({ slug: draftGlobalSlug, locale: 'fr' })).title).toBe(
      'Live French',
    )
  })

  test('should create initial locale drafts when a latest global has no starting copy', async ({
    payload,
  }) => {
    const result = await payload.updateGlobal({
      slug: draftGlobalSlug,
      data: { title: { en: '', fr: '' } },
      locale: 'all',
      version: 'latest',
    })

    expect(result._status).toEqual({ en: 'draft', fr: 'draft' })
    expect((await payload.findGlobal({ slug: draftGlobalSlug })).title).toBeUndefined()
  })

  for (const isGlobal of [false, true]) {
    test(`should retain publication states when a mixed latest publication is denied in ${isGlobal ? 'globals' : 'collections'}`, async ({
      payload,
    }) => {
      const created = isGlobal
        ? await payload.updateGlobal({
            slug: draftGlobalSlug,
            data: { _status: 'published', title: { en: 'Live English', fr: 'Live French' } },
            locale: 'all',
            version: 'draft',
          })
        : await payload.create({
            collection: localizedPostsSlug,
            data: { title: { en: 'Live English', fr: 'Live French' } },
            locale: 'all',
            version: 'published',
          })
      const target = { id: created.id, collection: localizedPostsSlug }

      if (isGlobal) {
        await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: { title: 'Pending English' },
          locale: 'en',
          version: 'draft',
        })
      } else {
        await payload.update({
          ...target,
          data: { title: 'Pending English' },
          locale: 'en',
          version: 'draft',
        })
      }
      const fields = isGlobal
        ? payload.globals.config.find((global) => global.slug === draftGlobalSlug)!.fields
        : payload.collections[localizedPostsSlug].config.fields
      const field = fields.find((field) => 'name' in field && field.name === '_status')!
      const previousAccess = field.access

      field.access = { ...previousAccess, update: () => false }
      try {
        if (isGlobal) {
          await payload.updateGlobal({
            slug: draftGlobalSlug,
            data: { _status: 'published', title: { en: 'Edited English', fr: 'Edited French' } },
            locale: 'all',
            version: 'latest',
          })
        } else {
          await payload.update({
            ...target,
            data: { _status: 'published', title: { en: 'Edited English', fr: 'Edited French' } },
            locale: 'all',
            version: 'latest',
          })
        }
        const live = isGlobal
          ? await payload.findGlobal({ slug: draftGlobalSlug, locale: 'all' })
          : await payload.findByID({ ...target, locale: 'all' })
        const latest = isGlobal
          ? await payload.findGlobal({ slug: draftGlobalSlug, locale: 'all', version: 'latest' })
          : await payload.findByID({ ...target, locale: 'all', version: 'latest' })

        expect(live.title).toEqual({ en: 'Live English', fr: 'Edited French' })
        expect(latest._status).toEqual({ en: 'draft', fr: 'published' })
      } finally {
        field.access = previousAccess
      }
    })

    test(`should publish mixed latest locale edits when explicitly requested in ${isGlobal ? 'globals' : 'collections'}`, async ({
      payload,
    }) => {
      const created = isGlobal
        ? await payload.updateGlobal({
            slug: draftGlobalSlug,
            data: { _status: 'published', title: { en: 'Live English', fr: 'Live French' } },
            locale: 'all',
            version: 'draft',
          })
        : await payload.create({
            collection: localizedPostsSlug,
            data: { title: { en: 'Live English', fr: 'Live French' } },
            locale: 'all',
            version: 'published',
          })
      const target = { id: created.id, collection: localizedPostsSlug }

      if (isGlobal) {
        await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: { title: 'Pending English' },
          locale: 'en',
          version: 'draft',
        })
        await payload.updateGlobal({
          slug: draftGlobalSlug,
          data: { _status: 'published' },
          locale: 'all',
          version: 'latest',
        })
      } else {
        await payload.update({
          ...target,
          data: { title: 'Pending English' },
          locale: 'en',
          version: 'draft',
        })
        await payload.update({
          ...target,
          data: { _status: 'published' },
          locale: 'all',
          version: 'latest',
        })
      }
      const published = isGlobal
        ? await payload.findGlobal({ slug: draftGlobalSlug, locale: 'all' })
        : await payload.findByID({ ...target, locale: 'all' })

      expect(published.title).toEqual({ en: 'Pending English', fr: 'Live French' })
      expect(published._status).toEqual({ en: 'published', fr: 'published' })
    })
  }
})
