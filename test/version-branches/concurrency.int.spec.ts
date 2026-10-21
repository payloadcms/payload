/* eslint-disable payload/no-relative-monorepo-imports -- Exercise native conflicts through independent caller transactions. */
import type { JsonObject, Payload, PayloadRequest } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import type { BranchStorageTarget } from '../../packages/payload/src/versions/branches/storage/branchStorage.js'
import type { BranchVersionReference } from '../../packages/payload/src/versions/branches/types.js'

import {
  commitBranchHeads,
  readBranchHeadToken,
  writeBranchHead,
} from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import {
  initializeBranchVersion,
  pinBranchVersion,
  readBranchVersion,
  saveBranchAutosave,
} from '../../packages/payload/src/versions/branches/storage/branchVersionStore.js'
import { test } from '../__helpers/int/vitest.js'
import { articleHeadsSlug, articlesSlug } from './slugs.js'

const scope = { locale: 'en', type: 'locale' as const }
const pinsSlug = `collection-${articlesSlug}-pins`

test.suite('Independent branch transactions', { config: './config.ts' }, () => {
  test('should commit one competing head revision without retaining the losing pin', async ({
    payload,
  }) => {
    const { references, target } = await createRevisions({ payload, titles: ['First', 'Second'] })

    await inTransaction({
      payload,
      run: async ({ req }) => {
        const expected = await readBranchHeadToken({ branchID: 'staging', req, scope, target })

        await writeBranchHead({ expected, nextState: { type: 'withdrawn' }, req, target })
      },
    })

    const results = await compete({
      observe: ({ req }) => readBranchHeadToken({ branchID: 'staging', req, scope, target }),
      payload,
      run: async ({ index, observation: expected, req }) => {
        const written = await writeBranchHead({
          expected,
          nextState: { structure: null, type: 'version', version: references[index]! },
          req,
          target,
        })

        if (!written) {
          throw new Error('Competing head observation changed.')
        }

        return references[index]!
      },
    })
    const winner = onlyCommitted({ results })
    const req = await createPayloadRequest({ payload })
    const head = await readBranchHeadToken({ branchID: 'staging', req, scope, target })
    const pins = await payload.db.find({ collection: pinsSlug, pagination: false })

    expect(head).toMatchObject({
      generation: 2,
      state: { type: 'version', version: winner.value },
    })
    expect(pins.docs).toHaveLength(1)
    expect(pins.docs[0]).toMatchObject({
      versionGeneration: winner.value.generation,
      versionID: winner.value.id,
    })

    for (const [index, reference] of references.entries()) {
      expect(await readRevision({ payload, reference, target })).toMatchObject({
        branchFrozen: index === winner.index,
        branchGeneration: 1,
        version: { title: { en: index === 0 ? 'First' : 'Second' } },
      })
    }
  })

  for (const firstCommitIndex of [0, 1]) {
    test(`should preserve exact pin semantics when ${firstCommitIndex === 0 ? 'the pin' : 'the autosave'} commits first`, async ({
      payload,
    }) => {
      const { references, target } = await createRevisions({ payload, titles: ['Original'] })
      const reference = references[0]!
      const before = await payload.db.countVersions({ collection: articlesSlug })
      const replacement: JsonObject = { _status: { en: 'draft' }, title: { en: 'Replacement' } }
      const results = await compete({
        firstCommitIndex,
        observe: async ({ req }) => {
          const row = await readBranchVersion({
            entity: { parentID: target.parentID!, slug: articlesSlug, type: 'collection' },
            req,
            versionID: reference.id,
          })

          expect(row).toMatchObject({ branchGeneration: 1, version: { title: { en: 'Original' } } })

          return reference
        },
        payload,
        run: async ({ index, observation, req }) =>
          index === 0
            ? pinBranchVersion({ reference: observation, req, rootKey: 'racing-release', target })
            : saveBranchAutosave({
                branchID: 'drafts',
                data: replacement,
                expected: observation,
                req,
                target,
              }),
      })
      const pin = results[0]!
      const autosave = results[1]!
      const original = await readRevision({ payload, reference, target })
      const pins = await payload.db.find({ collection: pinsSlug, pagination: false })

      expect(results[firstCommitIndex]!.isCommitted).toBe(true)

      expect(original).toMatchObject({
        branchFrozen: pin.isCommitted,
        branchGeneration: pin.isCommitted ? 1 : 2,
        version: { title: { en: pin.isCommitted ? 'Original' : 'Replacement' } },
      })
      expect(
        pins.docs.map(({ rootKey, versionGeneration, versionID }) => ({
          rootKey,
          versionGeneration,
          versionID,
        })),
      ).toStrictEqual(
        pin.isCommitted
          ? [{ rootKey: 'racing-release', versionGeneration: 1, versionID: reference.id }]
          : [],
      )
      expect(autosave.isCommitted && autosave.value.id === reference.id).toBe(!pin.isCommitted)

      const saved = autosave.isCommitted
        ? await readRevision({ payload, reference: autosave.value, target })
        : null
      const hasCommittedCopy = autosave.isCommitted && autosave.value.id !== reference.id
      const replacementSnapshot = expect.objectContaining({
        branchFrozen: false,
        branchGeneration: hasCommittedCopy ? 1 : 2,
        version: expect.objectContaining({ title: { en: 'Replacement' } }),
      })

      expect(saved).toEqual(autosave.isCommitted ? replacementSnapshot : null)
      expect((await payload.db.countVersions({ collection: articlesSlug })).totalDocs).toBe(
        before.totalDocs + (hasCommittedCopy ? 1 : 0),
      )
    })
  }

  test('should prevent opposing dependency reads from committing both destination heads', async ({
    payload,
  }) => {
    const branches = ['left', 'right'] as const
    const { references, target } = await createRevisions({ payload, titles: ['Left', 'Right'] })

    await inTransaction({
      payload,
      run: async ({ req }) => {
        for (const branchID of branches) {
          const expected = await readBranchHeadToken({ branchID, req, scope, target })

          await writeBranchHead({ expected, nextState: { type: 'withdrawn' }, req, target })
        }
      },
    })

    const results = await compete({
      observe: async ({ index, req }) => {
        const own = await readBranchHeadToken({ branchID: branches[index]!, req, scope, target })
        const dependency = await readBranchHeadToken({
          branchID: branches[1 - index]!,
          req,
          scope,
          target,
        })

        expect(own).toMatchObject({ generation: 1, state: { type: 'withdrawn' } })
        expect(dependency).toMatchObject({ generation: 1, state: { type: 'withdrawn' } })

        return { dependency, own }
      },
      payload,
      run: async ({ index, observation, req }) => {
        await commitBranchHeads({
          changes: [
            {
              expected: observation.own,
              nextState: { structure: null, type: 'version', version: references[index]! },
            },
          ],
          readSet: [observation.dependency],
          req,
          target,
        })

        return references[index]!
      },
    })
    const winner = onlyCommitted({ results })
    const req = await createPayloadRequest({ payload })
    const pins = await payload.db.find({ collection: pinsSlug, pagination: false })

    expect(pins.docs).toHaveLength(1)
    expect(pins.docs[0]).toMatchObject({ versionID: winner.value.id, versionGeneration: 1 })
    expect((await payload.db.count({ collection: articleHeadsSlug })).totalDocs).toBe(2)

    for (const [index, branchID] of branches.entries()) {
      const head = await readBranchHeadToken({ branchID, req, scope, target })

      expect(head).toMatchObject(
        index === winner.index
          ? { generation: 2, state: { type: 'version', version: winner.value } }
          : { generation: 1, state: { type: 'withdrawn' } },
      )
      expect(await readRevision({ payload, reference: references[index]!, target })).toMatchObject({
        branchFrozen: index === winner.index,
        branchGeneration: 1,
        version: { title: { en: index === 0 ? 'Left' : 'Right' } },
      })
    }
  })
})

type CompetitionResult<T> =
  | { index: number; isCommitted: false }
  | { index: number; isCommitted: true; value: T }

/**
 * MongoDB/Postgres both observe before either mutates, on distinct caller sessions.
 * libSQL opens BEGIN IMMEDIATE and ignores deferred transaction options, so SQLite
 * observes before beginning: its contenders serialize or reject a busy writer.
 * The pin tests order commits after both reads; other cases race mutation and commit.
 * Each caller owns its commit and rollback, including native conflict failures.
 */
const compete = async <TObservation, TResult>({
  firstCommitIndex,
  observe,
  payload,
  run,
}: {
  firstCommitIndex?: number
  observe: (args: { index: number; req: PayloadRequest }) => Promise<TObservation>
  payload: Payload
  run: (args: { index: number; observation: TObservation; req: PayloadRequest }) => Promise<TResult>
}): Promise<CompetitionResult<TResult>[]> => {
  let finishFirst!: () => void
  const firstFinished = new Promise<void>((resolve) => {
    finishFirst = resolve
  })
  let arrivals = 0
  let release!: () => void
  const observed = new Promise<void>((resolve) => {
    release = resolve
  })
  const afterObservation = async () => {
    arrivals++

    if (arrivals === 2) {
      release()
    }

    await observed
  }
  const results = await Promise.allSettled(
    [0, 1].map(async (index): Promise<CompetitionResult<TResult>> => {
      try {
        let observation: TObservation

        if (payload.db.name === 'sqlite') {
          observation = await observe({ index, req: await createPayloadRequest({ payload }) })
          await afterObservation()

          if (firstCommitIndex !== undefined && index !== firstCommitIndex) {
            await firstFinished
          }
        }

        const value = await inTransaction({
          payload,
          run: async ({ req }) => {
            if (payload.db.name !== 'sqlite') {
              observation = await observe({ index, req })
              await afterObservation()

              if (firstCommitIndex !== undefined && index !== firstCommitIndex) {
                await firstFinished
              }
            }

            return run({ index, observation: observation!, req })
          },
        })

        return { index, isCommitted: true, value }
      } catch (error) {
        // An unexpected read/begin error must also release the peer's read barrier.
        release()

        if (!isExpectedConflict({ error })) {
          throw error
        }

        return { index, isCommitted: false }
      } finally {
        if (index === firstCommitIndex) {
          finishFirst()
        }
      }
    }),
  )

  return results.map((result) => {
    if (result.status === 'rejected') {
      throw result.reason
    }

    return result.value
  })
}

const onlyCommitted = <T>({ results }: { results: CompetitionResult<T>[] }) => {
  const committed = results.filter((result) => result.isCommitted)

  expect(committed).toHaveLength(1)

  return committed[0]!
}

const isExpectedConflict = ({ error }: { error: unknown }): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const { cause, code, message } = error as { cause?: unknown; code?: unknown; message?: unknown }

  if (
    code === 112 ||
    code === '40001' ||
    code === '40P01' ||
    code === 'SQLITE_BUSY' ||
    code === 'SQLITE_BUSY_SNAPSHOT'
  ) {
    return true
  }

  if (
    typeof message === 'string' &&
    [
      'Autosave version revision changed.',
      'Autosave version revision changed or was pinned concurrently.',
      'Branch batch observation changed; roll back the caller transaction.',
      'Cannot pin a missing, wrong-parent, unmanaged, or stale version revision.',
      'Competing head observation changed.',
    ].includes(message)
  ) {
    return true
  }

  // beginTransaction wraps SQLite's native busy code into its error message.
  return (
    (typeof message === 'string' &&
      message.startsWith('Error: cannot begin transaction: SQLITE_BUSY:')) ||
    isExpectedConflict({ error: cause })
  )
}

const inTransaction = async <T>({
  payload,
  run,
}: {
  payload: Payload
  run: (args: { req: PayloadRequest }) => Promise<T>
}): Promise<T> => {
  const req = await createPayloadRequest({ payload })
  const transactionID = await payload.db.beginTransaction()

  if (transactionID === null) {
    throw new Error('Independent branch concurrency requires native caller transactions.')
  }

  req.transactionID = transactionID

  try {
    const result = await run({ req })

    await payload.db.commitTransaction(transactionID)

    return result
  } finally {
    if (payload.db.sessions?.[transactionID]) {
      await payload.db.rollbackTransaction(transactionID)
    }

    req.transactionID = undefined
  }
}

const createRevisions = async ({ payload, titles }: { payload: Payload; titles: string[] }) => {
  const article = await payload.create({
    collection: articlesSlug,
    data: { _status: 'published', title: 'Live' },
    locale: 'en',
  })
  const target = { collection: articleHeadsSlug, parentID: article.id }
  const references = await inTransaction({
    payload,
    run: async ({ req }) => {
      const references: BranchVersionReference[] = []

      for (const title of titles) {
        const timestamp = new Date().toISOString()
        const version = await payload.db.createVersion({
          autosave: true,
          branchMode: true,
          collectionSlug: articlesSlug,
          createdAt: timestamp,
          parent: article.id,
          req,
          updatedAt: timestamp,
          versionData: { _status: { en: 'draft' }, title: { en: title } },
        })

        references.push(
          await initializeBranchVersion({
            branchID: 'drafts',
            isFrozen: false,
            req,
            target,
            versionID: version.id,
          }),
        )
      }

      return references
    },
  })

  return { references, target }
}

const readRevision = async ({
  payload,
  reference,
  target,
}: {
  payload: Payload
  reference: BranchVersionReference
  target: BranchStorageTarget
}) =>
  readBranchVersion({
    entity: { parentID: target.parentID!, slug: articlesSlug, type: 'collection' },
    req: await createPayloadRequest({ payload }),
    versionID: reference.id,
  })
