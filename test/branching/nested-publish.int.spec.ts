import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { branchesSlug, nestedPagesSlug } from './shared.js'

type NestedPage = {
  id: number | string
  layout: {
    blockType: 'content'
    heading?: null | string
    id?: null | string
    items?: { id?: null | string; label?: null | string }[] | null
  }[]
}

test.suite(
  'Branching: publishing inherited blocks',
  { config: './nested-publish.config.ts', db: 'all' },
  () => {
    for (const shouldAutosave of [false, true]) {
      test(`should publish inherited block and array IDs without changing main (autosave: ${shouldAutosave})`, async ({
        payload,
      }) => {
        const branch = 'nested-publish'

        await payload.create({
          collection: branchesSlug,
          data: { name: branch },
          overrideAccess: true,
        })

        const source = (await payload.create({
          collection: nestedPagesSlug,
          data: {
            _status: 'published',
            title: 'Main page',
            layout: [
              { blockType: 'content', heading: 'Main heading', items: [{ label: 'Main item' }] },
            ],
          },
          locale: 'en',
          overrideAccess: true,
        })) as NestedPage

        const spanishSource = (await payload.update({
          id: source.id,
          collection: nestedPagesSlug,
          data: {
            _status: 'published',
            title: 'Spanish page',
            layout: [{ blockType: 'content', heading: 'Spanish heading' }],
          },
          locale: 'es',
          overrideAccess: true,
        })) as NestedPage

        const inherited = (await payload.findByID({
          id: source.id,
          branch,
          collection: nestedPagesSlug,
          locale: 'en',
          overrideAccess: true,
        })) as NestedPage

        expect(inherited.layout).toEqual(source.layout)

        const layout = inherited.layout.map((block) => ({
          ...block,
          heading: 'Branch heading',
          items: block.items?.map((item) => ({ ...item, label: 'Branch item' })),
        }))

        if (shouldAutosave) {
          await payload.update({
            id: source.id,
            autosave: true,
            branch,
            collection: nestedPagesSlug,
            data: { layout },
            draft: true,
            locale: 'en',
            overrideAccess: true,
          })
        }

        const published = await payload.update({
          id: source.id,
          branch,
          collection: nestedPagesSlug,
          data: { _status: 'published', layout },
          locale: 'en',
          overrideAccess: true,
        })

        expect(published).toMatchObject({ id: source.id, _status: 'published', layout })

        const storedBranch = await payload.findByID({
          id: source.id,
          branch,
          collection: nestedPagesSlug,
          locale: 'en',
          overrideAccess: true,
        })

        expect(storedBranch).toMatchObject({ id: source.id, _status: 'published', layout })

        const main = await payload.findByID({
          id: source.id,
          collection: nestedPagesSlug,
          locale: 'en',
          overrideAccess: true,
        })

        expect(main.layout).toEqual(source.layout)

        const preflight = await payload.branches.merge({
          branch,
          dryRun: true,
          overrideAccess: true,
        })

        expect(preflight.validationErrors).toEqual([])
        expect(preflight.canMerge).toBe(true)

        const merge = await payload.branches.merge({ branch, overrideAccess: true })

        expect(merge.validationErrors).toEqual([])
        expect(merge.merged).toHaveLength(1)

        const merged = await payload.findByID({
          id: source.id,
          collection: nestedPagesSlug,
          locale: 'en',
          overrideAccess: true,
        })

        expect(merged.layout).toMatchObject([
          { blockType: 'content', heading: 'Branch heading', items: [{ label: 'Branch item' }] },
        ])

        const spanishMerged = await payload.findByID({
          id: source.id,
          collection: nestedPagesSlug,
          locale: 'es',
          overrideAccess: true,
        })

        expect(spanishMerged.layout).toMatchObject(
          spanishSource.layout.map(({ id: _id, ...block }) => block),
        )
      })
    }
  },
)
