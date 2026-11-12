import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { branchesSlug, orderableDraftsSlug, orderableJoinSlug, orderableSlug } from './shared.js'

type OrderableTestDocument = {
  _order?: null | string
  _orderable_items_order?: null | string
  '_orderable-drafts_draftItems_order'?: null | string
  id: number | string
  title?: null | string
}

test.suite('Branching: orderable', { config: './config.ts', db: 'all' }, () => {
  for (const collection of [orderableSlug, orderableDraftsSlug] as const) {
    for (const scope of ['collection', 'join'] as const) {
      for (const direction of ['greater', 'less'] as const) {
        test(`should preserve distinct branch order keys across successive moves and merging (${collection}, ${scope}, ${direction})`, async ({
          payload,
          restClient,
        }) => {
          const hasDrafts = collection === orderableDraftsSlug
          const joinField = hasDrafts ? 'draftItems' : 'items'
          const joinOrderFieldName = hasDrafts
            ? '_orderable-drafts_draftItems_order'
            : '_orderable_items_order'
          const orderableFieldName = scope === 'collection' ? '_order' : joinOrderFieldName
          const branch = await payload.create({
            collection: branchesSlug,
            data: { name: 'Successive reorder review' },
            overrideAccess: true,
          })
          const parent = await payload.create({
            collection: orderableJoinSlug,
            data: { title: 'Parent' },
            overrideAccess: true,
          })
          const documents: OrderableTestDocument[] = []

          for (const title of ['A', 'B', 'C', 'D']) {
            documents.push(
              await payload.create({
                collection,
                data: {
                  ...(hasDrafts ? { _status: 'published' as const } : {}),
                  parent: parent.id,
                  title,
                },
                overrideAccess: true,
              }),
            )
          }

          const originalOrder = documents.map((doc) => ({
            id: doc.id,
            key: doc[orderableFieldName],
          }))
          const target = direction === 'greater' ? documents[0]! : documents[3]!
          const documentsToMove =
            direction === 'greater'
              ? [documents[2]!, documents[3]!]
              : [documents[1]!, documents[0]!]
          const expectedTitles =
            direction === 'greater' ? ['A', 'D', 'C', 'B'] : ['C', 'B', 'A', 'D']
          const query = new URLSearchParams({ branch: branch.name })

          await restClient.login({ slug: 'users' })

          for (const doc of documentsToMove) {
            const response = await restClient.POST(`/reorder?${query}`, {
              body: JSON.stringify({
                collectionSlug: collection,
                docsToMove: [doc.id],
                newKeyWillBe: direction,
                orderableFieldName,
                target: { id: target.id, key: target[orderableFieldName] },
              }),
            })

            expect(response.status).toBe(200)
          }

          const onBranch: { docs: OrderableTestDocument[] } = await payload.find({
            branch: branch.name,
            collection,
            draft: hasDrafts,
            overrideAccess: true,
            pagination: false,
            sort: orderableFieldName,
          })
          const branchOrder = onBranch.docs.map((doc) => ({
            id: doc.id,
            key: doc[orderableFieldName],
          }))

          expect(new Set(branchOrder.map(({ key }) => key)).size).toBe(4)
          expect(onBranch.docs.map(({ title }) => title)).toEqual(expectedTitles)

          for (const draft of hasDrafts ? [false, true] : [false]) {
            const onMain: { docs: OrderableTestDocument[] } = await payload.find({
              branch: 'main',
              collection,
              draft,
              overrideAccess: true,
              pagination: false,
              sort: orderableFieldName,
            })

            expect(
              onMain.docs.map((doc) => ({ id: doc.id, key: doc[orderableFieldName] })),
            ).toEqual(originalOrder)
          }

          for (const field of scope === 'join' ? [joinField] : []) {
            const joined = await payload.findByID({
              id: parent.id,
              branch: branch.name,
              collection: orderableJoinSlug,
              depth: 1,
              overrideAccess: true,
            })

            expect(
              joined[field]?.docs?.map((doc) => (typeof doc === 'object' ? doc.id : doc)),
            ).toEqual(branchOrder.map(({ id }) => id))
          }

          const result = await payload.branches.merge({ branch: branch.name, overrideAccess: true })

          expect(result.blocked).toEqual([])
          expect(result.validationErrors).toEqual([])
          expect(result.merged).toHaveLength(2)

          for (const draft of hasDrafts ? [false, true] : [false]) {
            const merged: { docs: OrderableTestDocument[] } = await payload.find({
              branch: 'main',
              collection,
              draft,
              overrideAccess: true,
              pagination: false,
              sort: orderableFieldName,
            })

            expect(
              merged.docs.map((doc) => ({ id: doc.id, key: doc[orderableFieldName] })),
            ).toEqual(branchOrder)
          }

          for (const field of scope === 'join' ? [joinField] : []) {
            const joined = await payload.findByID({
              id: parent.id,
              branch: 'main',
              collection: orderableJoinSlug,
              depth: 1,
              overrideAccess: true,
            })

            expect(
              joined[field]?.docs?.map((doc) => (typeof doc === 'object' ? doc.id : doc)),
            ).toEqual(branchOrder.map(({ id }) => id))
          }
        })
      }
    }

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
