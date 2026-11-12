import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { branchesSlug, orderableDraftsSlug, orderableSlug } from './shared.js'

test.suite('Branching: orderable', { config: './config.ts', db: 'all' }, () => {
  for (const collection of [orderableSlug, orderableDraftsSlug] as const) {
    for (const api of ['local', 'REST'] as const) {
      test(`should isolate reordered documents on a branch and preserve their order after merging (${collection}, ${api})`, async ({
        payload,
        restClient,
      }) => {
        const hasDrafts = collection === orderableDraftsSlug
        const branch = await payload.create({
          collection: branchesSlug,
          data: { name: 'Reorder review' },
          overrideAccess: true,
        })
        const documents = []

        for (const title of ['A', 'B', 'C']) {
          documents.push(
            await payload.create({
              collection,
              data: { ...(hasDrafts ? { _status: 'published' as const } : {}), title },
              overrideAccess: true,
            }),
          )
        }

        const originalOrder = documents.map(({ id, _order }) => ({ id, _order }))

        expect(originalOrder.every(({ _order }) => typeof _order === 'string')).toBe(true)

        if (api === 'local') {
          for (const [index, doc] of [documents[2]!, documents[1]!].entries()) {
            await payload.update({
              id: doc.id,
              branch: branch.name,
              collection,
              data: { _order: ['9y', '9z'][index] },
              overrideAccess: true,
            })
          }
        } else {
          await restClient.login({ slug: 'users' })

          const query = new URLSearchParams({ branch: branch.name })
          const response = await restClient.POST(`/reorder?${query}`, {
            body: JSON.stringify({
              collectionSlug: collection,
              docsToMove: [documents[2]!.id, documents[1]!.id],
              newKeyWillBe: 'less',
              orderableFieldName: '_order',
              target: { id: documents[0]!.id, key: documents[0]!._order },
            }),
          })

          // oxlint-disable-next-line @vitest/no-conditional-expect -- Only REST cases have an HTTP response.
          expect(response.status).toBe(200)
        }

        const onBranch = await payload.find({
          branch: branch.name,
          collection,
          draft: hasDrafts,
          overrideAccess: true,
          pagination: false,
          sort: '_order',
        })
        const onMain = await payload.find({
          branch: 'main',
          collection,
          overrideAccess: true,
          pagination: false,
          sort: '_order',
        })

        expect(onBranch.docs.map(({ title }) => title)).toEqual(['C', 'B', 'A'])
        expect(onMain.docs.map(({ id, _order }) => ({ id, _order }))).toEqual(originalOrder)

        for (const draft of hasDrafts ? [false, true] : [false]) {
          const mainDrafts = await payload.find({
            branch: 'main',
            collection,
            draft,
            overrideAccess: true,
            pagination: false,
            sort: '_order',
          })

          expect(mainDrafts.docs.map(({ id, _order }) => ({ id, _order }))).toEqual(originalOrder)
        }

        const branchOrder = onBranch.docs.map(({ id, _order }) => ({ id, _order }))
        const result = await payload.branches.merge({ branch: branch.name, overrideAccess: true })

        expect(result.blocked).toEqual([])
        expect(result.validationErrors).toEqual([])
        expect(result.merged).toHaveLength(2)

        for (const draft of hasDrafts ? [false, true] : [false]) {
          const merged = await payload.find({
            branch: 'main',
            collection,
            draft,
            overrideAccess: true,
            pagination: false,
            sort: '_order',
          })

          expect(merged.docs.map(({ title }) => title)).toEqual(['C', 'B', 'A'])
          expect(merged.docs.map(({ id, _order }) => ({ id, _order }))).toEqual(branchOrder)

          expect(merged.docs.map((doc) => ('_status' in doc ? doc._status : undefined))).toEqual(
            hasDrafts ? ['published', 'published', 'published'] : [undefined, undefined, undefined],
          )
        }
      })
    }
  }
})
