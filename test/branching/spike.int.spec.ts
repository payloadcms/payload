import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { antiJoinProbeSlug, latestProbeSlug, sentinelProbeSlug } from './shared.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isMongo =
  process.env.PAYLOAD_DATABASE === undefined || process.env.PAYLOAD_DATABASE === 'mongodb'

/**
 * Phase 0 spike — CONTENT_BRANCHING_PLAN.md §19, §22.
 *
 * The branching design rests on three claims that were inferred from reading
 * the codebase rather than from running anything. Each can invalidate part of
 * the design, so they are verified here before anything is built on them.
 *
 * These tests describe *current Payload behavior*, not branching behavior.
 * They should keep passing forever; if one starts failing, the corresponding
 * design decision needs revisiting.
 */
describe('Branching — phase 0 spike', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname, undefined, true, 'spike.config.ts'))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  /**
   * Documents *current* behavior, which is not what a shadow-tracking
   * predicate needs. Two independent defects on relational adapters:
   *
   *   1. Multiplicity leak — a doc shadowed on ['a','b'] survives
   *      `not_in: ['a']`, because the join emits one row per value and the
   *      'b' row satisfies the constraint.
   *   2. Empty-array exclusion — a doc shadowed on nothing is dropped,
   *      because it produces no joined rows for the WHERE to match at all.
   *
   * (2) was not predicted in the design and is the more damaging: in a branch
   * read it would hide every untouched main document.
   *
   * Mongo's `$nin` handles both correctly, which is why this would have
   * survived a Mongo-only test run. If the relational test below ever fails,
   * `not_in` on hasMany has been fixed and §5a is worth reconsidering.
   */
  describe('Assumption 1: `not_in` on a hasMany field (§5a)', () => {
    const createdIDs: (number | string)[] = []
    let shadowedOnAB: number | string
    let shadowedOnA: number | string
    let shadowedOnNothing: number | string
    let returnedIDs: (number | string)[]

    beforeAll(async () => {
      const abDoc = await payload.create({
        collection: antiJoinProbeSlug,
        data: { shadowedBy: ['a', 'b'], title: 'shadowed on a and b' },
      })
      const aDoc = await payload.create({
        collection: antiJoinProbeSlug,
        data: { shadowedBy: ['a'], title: 'shadowed on a only' },
      })
      const noneDoc = await payload.create({
        collection: antiJoinProbeSlug,
        data: { shadowedBy: [], title: 'not shadowed' },
      })

      shadowedOnAB = abDoc.id
      shadowedOnA = aDoc.id
      shadowedOnNothing = noneDoc.id
      createdIDs.push(abDoc.id, aDoc.id, noneDoc.id)

      const result = await payload.find({
        collection: antiJoinProbeSlug,
        pagination: false,
        where: { shadowedBy: { not_in: ['a'] } },
      })

      returnedIDs = result.docs.map((doc) => doc.id)
    })

    afterAll(async () => {
      for (const id of createdIDs) {
        await payload.delete({ id, collection: antiJoinProbeSlug })
      }
      createdIDs.length = 0
    })

    it('should exclude a doc shadowed on exactly the queried value', () => {
      expect(returnedIDs).not.toContain(shadowedOnA)
    })

    it.skipIf(isMongo)('should leak a doc shadowed on [a, b] — relational multiplicity', () => {
      expect(returnedIDs).toContain(shadowedOnAB)
    })

    it.skipIf(isMongo)(
      'should drop a doc shadowed on nothing — relational empty-array exclusion',
      () => {
        expect(returnedIDs).not.toContain(shadowedOnNothing)
      },
    )

    it.runIf(isMongo)('should exclude a doc shadowed on [a, b] — Mongo $nin is correct', () => {
      expect(returnedIDs).not.toContain(shadowedOnAB)
    })

    it.runIf(isMongo)('should return a doc shadowed on nothing — Mongo $nin is correct', () => {
      expect(returnedIDs).toContain(shadowedOnNothing)
    })
  })

  describe('Assumption 2: compound unique index with a non-null sentinel (§3)', () => {
    const createdIDs: (number | string)[] = []

    afterAll(async () => {
      for (const id of createdIDs) {
        await payload.delete({ id, collection: sentinelProbeSlug })
      }
      createdIDs.length = 0
    })

    it('should allow the same slug on two different branches', async () => {
      const onMain = await payload.create({
        collection: sentinelProbeSlug,
        data: { slug: 'about', branch: 'main' },
      })
      createdIDs.push(onMain.id)

      const onBranch = await payload.create({
        collection: sentinelProbeSlug,
        data: { slug: 'about', branch: 'halloween' },
      })
      createdIDs.push(onBranch.id)

      expect(onBranch.slug).toBe('about')
    })

    it('should still reject a duplicate slug within the same branch', async () => {
      const first = await payload.create({
        collection: sentinelProbeSlug,
        data: { slug: 'contact', branch: 'main' },
      })
      createdIDs.push(first.id)

      // This is the assertion the `'main'` sentinel exists for. With NULL as
      // the main-branch marker, Postgres would treat the two rows as distinct
      // and this insert would succeed, silently dropping uniqueness on main.
      await expect(
        payload.create({
          collection: sentinelProbeSlug,
          data: { slug: 'contact', branch: 'main' },
        }),
      ).rejects.toThrow()
    })
  })

  describe('Assumption 3: `latest` is scoped per parent on collection versions (§7)', () => {
    const createdIDs: (number | string)[] = []

    afterAll(async () => {
      for (const id of createdIDs) {
        await payload.delete({ id, collection: latestProbeSlug })
      }
      createdIDs.length = 0
    })

    it('should keep an independent latest version for each parent document', async () => {
      const first = await payload.create({
        collection: latestProbeSlug,
        data: { title: 'first v1' },
        draft: true,
      })
      createdIDs.push(first.id)

      const second = await payload.create({
        collection: latestProbeSlug,
        data: { title: 'second v1' },
        draft: true,
      })
      createdIDs.push(second.id)

      // Save a second version of `first` only. If `latest` were global rather
      // than per-parent, this would clear `second`'s latest flag too.
      await payload.update({
        id: first.id,
        collection: latestProbeSlug,
        data: { title: 'first v2' },
        draft: true,
      })

      const latestForFirst = await payload.findVersions({
        collection: latestProbeSlug,
        pagination: false,
        where: { and: [{ parent: { equals: first.id } }, { latest: { equals: true } }] },
      })

      const latestForSecond = await payload.findVersions({
        collection: latestProbeSlug,
        pagination: false,
        where: { and: [{ parent: { equals: second.id } }, { latest: { equals: true } }] },
      })

      // Exactly one latest per parent, and both parents still have one. This
      // is what lets a branch shadow row carry its own version chain with no
      // change to `latest` semantics at all.
      expect(latestForFirst.docs).toHaveLength(1)
      expect(latestForSecond.docs).toHaveLength(1)
      expect(latestForFirst.docs[0]?.version.title).toBe('first v2')
      expect(latestForSecond.docs[0]?.version.title).toBe('second v1')
    })
  })

  describe('Assumption 4: `latest` on global versions is NOT scoped (§8)', () => {
    it.todo(
      'should clobber a sibling stream when a second global version is created — requires _branch to exist before it can be expressed',
    )
  })
})
