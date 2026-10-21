/* eslint-disable payload/no-relative-monorepo-imports -- Verify the internal branch adapter contract against real database transactions. */
import type { Payload, PayloadRequest } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import type { BranchVersionReference } from '../../packages/payload/src/versions/branches/types.js'

import { updateOperation as updateGlobalOperation } from '../../packages/payload/src/globals/operations/update.js'
import {
  commitBranchHeads,
  discardBranchHead,
  readBranchHeadToken,
  writeBranchHead,
} from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import {
  allocateBranchIdentity,
  createBranchIdentityVisibility,
  isBranchIdentityVisible,
  readBranchIdentityVisibility,
  updateBranchIdentityVisibility,
} from '../../packages/payload/src/versions/branches/storage/branchIdentityStore.js'
import {
  initializeBranchVersion,
  pinBranchVersion,
  saveBranchAutosave,
} from '../../packages/payload/src/versions/branches/storage/branchVersionStore.js'
import { getLatestCollectionVersion } from '../../packages/payload/src/versions/getLatestCollectionVersion.js'
import { getLatestGlobalVersion } from '../../packages/payload/src/versions/getLatestGlobalVersion.js'
import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import { articleHeadsSlug, articlesSlug, settingsHeadsSlug, settingsSlug } from './slugs.js'

const scope = { locale: 'en', type: 'locale' as const }
const suiteOptions = { config: './config.ts', ...nativeBranchDatabaseOptions }

test.suite('Version-backed branch adapter foundation', suiteOptions, () => {
  test('should freeze and retain the exact revision selected by a durable pin', async ({
    payload,
  }) => {
    const { reference, target } = await createManagedAutosave({ payload })

    await inTransaction({
      payload,
      run: async ({ req }) => {
        await pinBranchVersion({ reference, req, rootKey: 'scheduled-release', target })
        await pinBranchVersion({ reference, req, rootKey: 'scheduled-release', target })
      },
    })

    const stored = await readArticleVersion({ payload, versionID: reference.id })
    const pins = await payload.db.find({
      collection: `${articlesSlugPrefix}-pins`,
      pagination: false,
      where: { parent: { equals: target.parentID } },
    })

    expect(stored).toMatchObject({ branchFrozen: true, branchGeneration: reference.generation })
    expect(pins.docs).toHaveLength(1)
    expect(pins.docs[0]).toMatchObject({
      rootKey: 'scheduled-release',
      versionGeneration: reference.generation,
      versionID: reference.id,
    })
  })

  test('should refuse adoption of a version belonging to another logical document', async ({
    payload,
  }) => {
    const first = await payload.create({
      collection: articlesSlug,
      data: { title: 'First' },
      draft: true,
    })
    const second = await payload.create({
      collection: articlesSlug,
      data: { title: 'Second' },
      draft: true,
    })
    const versions = await payload.findVersions({
      collection: articlesSlug,
      where: { parent: { equals: first.id } },
    })

    await expect(
      inTransaction({
        payload,
        run: ({ req }) =>
          initializeBranchVersion({
            branchID: 'drafts',
            isFrozen: false,
            req,
            target: { collection: articleHeadsSlug, parentID: second.id },
            versionID: versions.docs[0]!.id,
          }),
      }),
    ).rejects.toThrow()

    expect(
      await readArticleVersion({ payload, versionID: versions.docs[0]!.id }),
    ).not.toHaveProperty('branchGeneration', 1)
  })

  test('should refuse missing collection and global revisions before recording a pin', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { title: 'Existing' },
      draft: true,
    })
    const missingID =
      payload.db.defaultIDType === 'number' ? 2147483647 : 'ffffffffffffffffffffffff'

    for (const target of [
      { collection: articleHeadsSlug, parentID: article.id },
      { collection: settingsHeadsSlug },
    ]) {
      await expect(
        inTransaction({
          payload,
          run: ({ req }) =>
            pinBranchVersion({
              reference: { id: missingID, generation: 1 },
              req,
              rootKey: 'missing',
              target,
            }),
        }),
      ).rejects.toThrow()
    }

    expect((await payload.db.count({ collection: `${articlesSlugPrefix}-pins` })).totalDocs).toBe(0)
    expect((await payload.db.count({ collection: `${settingsSlugPrefix}-pins` })).totalDocs).toBe(0)
  })

  test('should reject a head whose managed version belongs to another document', async ({
    payload,
  }) => {
    const { reference } = await createManagedAutosave({ payload })
    const article = await payload.create({
      collection: articlesSlug,
      data: { title: 'Other document' },
      draft: true,
    })
    const target = { collection: articleHeadsSlug, parentID: article.id }
    const req = await createPayloadRequest({ payload })
    const expected = await readBranchHeadToken({ branchID: 'staging', req, scope, target })

    await expect(
      inTransaction({
        payload,
        run: ({ req }) =>
          writeBranchHead({
            expected,
            nextState: { type: 'version', structure: null, version: reference },
            req,
            target,
          }),
      }),
    ).rejects.toThrow()

    expect((await payload.db.count({ collection: articleHeadsSlug })).totalDocs).toBe(0)
    expect((await payload.db.count({ collection: `${articlesSlugPrefix}-pins` })).totalDocs).toBe(0)
    expect(await readArticleVersion({ payload, versionID: reference.id })).toMatchObject({
      branchFrozen: false,
    })
  })

  test('should reject malformed exact revisions before recording durable roots', async ({
    payload,
  }) => {
    const { reference, target } = await createManagedAutosave({ payload })

    for (const generation of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      await expect(
        inTransaction({
          payload,
          run: ({ req }) =>
            pinBranchVersion({
              reference: { id: reference.id, generation },
              req,
              rootKey: 'invalid',
              target,
            }),
        }),
      ).rejects.toThrow()
    }

    expect((await payload.db.count({ collection: `${articlesSlugPrefix}-pins` })).totalDocs).toBe(0)
    expect(await readArticleVersion({ payload, versionID: reference.id })).toMatchObject({
      branchFrozen: false,
      branchGeneration: reference.generation,
    })
  })

  test('should reject a stale exact revision after exclusive autosave advances it', async ({
    payload,
  }) => {
    const { reference, target } = await createManagedAutosave({ payload })
    const current = await inTransaction({
      payload,
      run: ({ req }) =>
        saveBranchAutosave({
          branchID: 'drafts',
          data: { title: { en: 'Advanced' } },
          expected: reference,
          req,
          target,
        }),
    })

    expect(current).toStrictEqual({ id: reference.id, generation: reference.generation + 1 })
    await expect(
      inTransaction({
        payload,
        run: ({ req }) => pinBranchVersion({ reference, req, rootKey: 'stale-release', target }),
      }),
    ).rejects.toThrow()

    expect((await payload.db.count({ collection: `${articlesSlugPrefix}-pins` })).totalDocs).toBe(0)
    expect(await readArticleVersion({ payload, versionID: reference.id })).toMatchObject({
      branchFrozen: false,
      branchGeneration: current.generation,
      version: { title: { en: 'Advanced' } },
    })
  })

  test('should prevent an adopted frozen revision from being reinitialized as mutable', async ({
    payload,
  }) => {
    const { reference, target } = await createManagedAutosave({ payload })

    await inTransaction({
      payload,
      run: ({ req }) => pinBranchVersion({ reference, req, rootKey: 'release', target }),
    })
    await expect(
      inTransaction({
        payload,
        run: ({ req }) =>
          initializeBranchVersion({
            branchID: 'drafts',
            isFrozen: false,
            req,
            target,
            versionID: reference.id,
          }),
      }),
    ).rejects.toThrow()

    expect(await readArticleVersion({ payload, versionID: reference.id })).toMatchObject({
      branchFrozen: true,
      branchGeneration: reference.generation,
    })
  })

  test('should copy a pinned autosave and preserve its scheduled content', async ({ payload }) => {
    const { reference, target } = await createManagedAutosave({ payload })

    await inTransaction({
      payload,
      run: ({ req }) => pinBranchVersion({ reference, req, rootKey: 'scheduled', target }),
    })

    const next = await inTransaction({
      payload,
      run: ({ req }) =>
        saveBranchAutosave({
          branchID: 'drafts',
          data: { title: { en: 'Next revision' } },
          expected: reference,
          req,
          target,
        }),
    })

    expect(next.id).not.toBe(reference.id)
    expect(await readArticleVersion({ payload, versionID: reference.id })).toMatchObject({
      branchFrozen: true,
      branchGeneration: reference.generation,
      version: { title: { en: 'Pinned candidate' } },
    })
    expect(await readArticleVersion({ payload, versionID: next.id })).toMatchObject({
      branchFrozen: false,
      branchGeneration: 1,
      version: { title: { en: 'Next revision' } },
    })
  })

  test('should refuse native replacement when pinning wins the revision guard', async ({
    payload,
  }) => {
    const { reference, target } = await createManagedAutosave({ payload })

    await inTransaction({
      payload,
      run: ({ req }) => pinBranchVersion({ reference, req, rootKey: 'pin-wins', target }),
    })

    const replacement = await inTransaction({
      payload,
      run: ({ req }) =>
        payload.db.branching!.mutateVersion({
          entity: { type: 'collection', slug: articlesSlug, parentID: target.parentID },
          expected: reference,
          mutation: {
            type: 'replace',
            ownerKey: 'string:drafts',
            data: { title: { en: 'Unsafe replacement' } },
          },
          req,
        }),
    })

    expect(replacement).toBeNull()
    expect(await readArticleVersion({ payload, versionID: reference.id })).toMatchObject({
      branchFrozen: true,
      branchGeneration: reference.generation,
      version: { title: { en: 'Pinned candidate' } },
    })
  })

  test('should preserve a pinned ordinary autosave when the Local API autosaves again', async ({
    payload,
  }) => {
    const { reference, target } = await createManagedAutosave({ payload })

    await inTransaction({
      payload,
      run: ({ req }) => pinBranchVersion({ reference, req, rootKey: 'scheduled', target }),
    })
    await payload.update({
      id: target.parentID,
      autosave: true,
      collection: articlesSlug,
      data: { title: 'Later ordinary autosave' },
      draft: true,
      locale: 'en',
    })

    const pinned = await readArticleVersion({ payload, versionID: reference.id })
    const working = await payload.findByID({
      id: target.parentID,
      collection: articlesSlug,
      draft: true,
      locale: 'en',
    })
    const versions = await payload.db.findVersions({
      collection: articlesSlug,
      limit: 0,
      locale: 'all',
      pagination: false,
      where: { parent: { equals: target.parentID } },
    })

    expect(pinned).toMatchObject({
      branchFrozen: true,
      branchGeneration: reference.generation,
      version: { title: { en: 'Pinned candidate' } },
    })
    expect(working.title).toBe('Later ordinary autosave')
    expect(
      versions.docs.some(
        (row) =>
          row.id !== reference.id &&
          (row.version.title as Record<string, string>).en === 'Later ordinary autosave',
      ),
    ).toBe(true)
  })

  test('should preserve ordinary draft content when another branch copies its autosave', async ({
    payload,
  }) => {
    const { reference, target } = await createManagedAutosave({ payload })
    const staging = await inTransaction({
      payload,
      run: ({ req }) =>
        saveBranchAutosave({
          branchID: 'staging',
          data: { title: { en: 'Staging only' } },
          expected: reference,
          req,
          target,
        }),
    })
    const working = await payload.findByID({
      id: target.parentID,
      collection: articlesSlug,
      draft: true,
      locale: 'en',
    })

    expect(staging.id).not.toBe(reference.id)
    expect(await readArticleVersion({ payload, versionID: reference.id })).toMatchObject({
      branchGeneration: reference.generation,
      version: { title: { en: 'Pinned candidate' } },
    })
    expect(await readArticleVersion({ payload, versionID: staging.id })).toMatchObject({
      branchOwnerKey: 'string:staging',
      version: { title: { en: 'Staging only' } },
    })
    expect(working.title).toBe('Pinned candidate')
  })

  test('should protect pinned global content when its working autosave changes', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug: settingsSlug,
      data: { _status: 'published', title: 'Live global' },
      locale: 'en',
    })
    await autosaveGlobal({ payload, title: 'Pinned global' })

    const versions = await payload.db.findGlobalVersions({
      global: settingsSlug,
      locale: 'all',
      limit: 1,
      sort: '-updatedAt',
    })

    expect(versions.docs[0]).toMatchObject({ autosave: true })

    const target = { collection: settingsHeadsSlug }
    const reference = await inTransaction({
      payload,
      run: ({ req }) =>
        initializeBranchVersion({
          branchID: 'drafts',
          isFrozen: false,
          req,
          target,
          versionID: versions.docs[0]!.id,
        }),
    })

    await inTransaction({
      payload,
      run: ({ req }) => pinBranchVersion({ reference, req, rootKey: 'global-release', target }),
    })
    await autosaveGlobal({ payload, title: 'Later global' })

    const stored = await payload.db.findGlobalVersions({
      global: settingsSlug,
      locale: 'all',
      where: { id: { equals: reference.id } },
    })
    const working = await payload.findGlobal({ slug: settingsSlug, draft: true, locale: 'en' })

    expect(stored.docs[0]).toMatchObject({
      branchFrozen: true,
      branchGeneration: reference.generation,
      version: { title: { en: 'Pinned global' } },
    })
    expect(working.title).toBe('Later global')
  })

  test('should isolate named branch snapshots with historical published status from legacy collection APIs', async ({
    payload,
  }) => {
    const { reference, target } = await createManagedAutosave({ payload })
    const staging = await inTransaction({
      payload,
      run: ({ req }) =>
        saveBranchAutosave({
          branchID: 'staging',
          data: { _status: { en: 'published' }, title: { en: 'Private staging publication' } },
          expected: reference,
          req,
          target,
        }),
    })
    const req = await createPayloadRequest({ payload, locale: 'en' })
    const published = await getLatestCollectionVersion({
      id: target.parentID,
      config: payload.collections[articlesSlug]!.config,
      payload,
      published: true,
      query: { collection: articlesSlug, locale: 'en', where: { id: { equals: target.parentID } } },
      req,
    })
    const history = await payload.findVersions({
      collection: articlesSlug,
      where: { parent: { equals: target.parentID } },
    })

    expect(await readArticleVersion({ payload, versionID: staging.id })).toMatchObject({
      branchOnly: true,
      latest: false,
      version: { _status: { en: 'published' } },
    })
    expect(published?.title).toMatchObject({ en: 'Live' })
    expect(history.docs.map(({ id }) => id)).not.toContain(staging.id)
    await expect(
      payload.findVersionByID({ collection: articlesSlug, id: String(staging.id) }),
    ).rejects.toMatchObject({ status: 404 })
    await expect(
      payload.restoreVersion({ collection: articlesSlug, id: String(staging.id), locale: 'en' }),
    ).rejects.toMatchObject({ status: 404 })
    expect(
      (await payload.findByID({ collection: articlesSlug, id: target.parentID, locale: 'en' }))
        .title,
    ).toBe('Live')
  })

  test('should isolate named branch snapshots with historical published status from legacy global APIs', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug: settingsSlug,
      data: { _status: 'published', title: 'Live global' },
      locale: 'en',
    })

    const versions = await payload.db.findGlobalVersions({
      global: settingsSlug,
      locale: 'all',
      limit: 1,
      sort: '-updatedAt',
    })
    const target = { collection: settingsHeadsSlug }
    const reference = await inTransaction({
      payload,
      run: ({ req }) =>
        initializeBranchVersion({
          branchID: 'main',
          isFrozen: true,
          req,
          target,
          versionID: versions.docs[0]!.id,
        }),
    })
    const staging = await inTransaction({
      payload,
      run: ({ req }) =>
        saveBranchAutosave({
          branchID: 'staging',
          data: { _status: { en: 'published' }, title: { en: 'Private global' } },
          expected: reference,
          req,
          target,
        }),
    })
    const req = await createPayloadRequest({ payload, locale: 'en' })
    const published = await getLatestGlobalVersion({
      config: payload.globals.config.find(({ slug }) => slug === settingsSlug)!,
      locale: 'en',
      payload,
      published: true,
      req,
      slug: settingsSlug,
      where: {},
    })
    const history = await payload.findGlobalVersions({ slug: settingsSlug })

    expect(published.global.title).toMatchObject({ en: 'Live global' })
    expect(history.docs.map(({ id }) => id)).not.toContain(staging.id)
    await expect(
      payload.findGlobalVersionByID({ slug: settingsSlug, id: staging.id }),
    ).rejects.toMatchObject({ status: 404 })
    await expect(
      payload.restoreGlobalVersion({ slug: settingsSlug, id: String(staging.id), locale: 'en' }),
    ).rejects.toMatchObject({ status: 404 })
    expect(
      (await payload.findGlobal({ slug: settingsSlug, draft: true, locale: 'en' })).title,
    ).toBe('Live global')
  })

  test('should roll back the version, head, pin and identity together with the caller transaction', async ({
    payload,
  }) => {
    const { reference, target } = await createManagedAutosave({ payload })
    const before = await payload.db.countVersions({
      collection: articlesSlug,
      where: { parent: { equals: target.parentID } },
    })

    await inTransaction({
      payload,
      shouldCommit: false,
      run: async ({ req }) => {
        const copy = await saveBranchAutosave({
          branchID: 'staging',
          data: { title: { en: 'Rolled back' } },
          expected: reference,
          req,
          target,
        })
        const expected = await readBranchHeadToken({ branchID: 'staging', req, scope, target })

        await writeBranchHead({
          expected,
          nextState: { type: 'version', structure: null, version: copy },
          req,
          target,
        })
        await createBranchIdentityVisibility({
          branchID: 'staging',
          isLegacyDraftVisible: false,
          req,
          target,
        })
      },
    })

    expect(
      await payload.db.countVersions({
        collection: articlesSlug,
        where: { parent: { equals: target.parentID } },
      }),
    ).toStrictEqual(before)
    for (const suffix of ['heads', 'pins', 'identities']) {
      expect(
        (await payload.db.count({ collection: `${articlesSlugPrefix}-${suffix}` })).totalDocs,
      ).toBe(0)
    }
  })

  test('should preserve the caller commit boundary for the first inherited write', async ({
    payload,
  }) => {
    const { reference, target } = await createManagedAutosave({ payload })

    await inTransaction({
      payload,
      shouldCommit: false,
      run: async ({ req }) => {
        const expected = await readBranchHeadToken({ branchID: 'staging', req, scope, target })
        const inherited = await readBranchHeadToken({ branchID: 'main', req, scope, target })
        const written = await commitBranchHeads({
          changes: [
            {
              base: inherited,
              expected,
              nextState: { type: 'version', structure: null, version: reference },
            },
          ],
          readSet: [expected, inherited],
          req,
          target,
        })

        expect(written).not.toBeNull()
        expect(
          await readBranchHeadToken({ branchID: 'staging', req, scope, target }),
        ).toMatchObject({ generation: 1 })
      },
    })

    const req = await createPayloadRequest({ payload })

    expect(await readBranchHeadToken({ branchID: 'staging', req, scope, target })).toMatchObject({
      generation: null,
      incarnation: 0,
    })
    expect(await readArticleVersion({ payload, versionID: reference.id })).toMatchObject({
      branchFrozen: false,
    })
    expect((await payload.db.count({ collection: `${articlesSlugPrefix}-pins` })).totalDocs).toBe(0)
  })

  test('should reject a changed inherited dependency before publishing a destination head', async ({
    payload,
  }) => {
    const req = await createPayloadRequest({ payload })
    const target = { collection: settingsHeadsSlug }
    const source = await readBranchHeadToken({ branchID: 'main', req, scope, target })
    const destination = await readBranchHeadToken({ branchID: 'staging', req, scope, target })

    await inTransaction({
      payload,
      run: ({ req }) =>
        writeBranchHead({ expected: source, nextState: { type: 'withdrawn' }, req, target }),
    })
    await expect(
      inTransaction({
        payload,
        run: ({ req }) =>
          commitBranchHeads({
            changes: [{ expected: destination, nextState: { type: 'withdrawn' } }],
            readSet: [source],
            req,
            target,
          }),
      }),
    ).rejects.toThrow('observation changed')

    expect(await readBranchHeadToken({ branchID: 'staging', req, scope, target })).toStrictEqual(
      destination,
    )
    expect((await payload.db.count({ collection: settingsHeadsSlug })).totalDocs).toBe(1)
  })

  test('should roll back earlier head changes and pins when a later scope cannot be committed', async ({
    payload,
  }) => {
    const { reference, target } = await createManagedAutosave({ payload })
    const req = await createPayloadRequest({ payload })
    const english = await readBranchHeadToken({ branchID: 'staging', req, scope, target })
    const french = await readBranchHeadToken({
      branchID: 'staging',
      req,
      scope: { type: 'locale', locale: 'fr' },
      target,
    })

    await expect(
      inTransaction({
        payload,
        run: ({ req }) =>
          commitBranchHeads({
            changes: [
              {
                expected: english,
                nextState: { type: 'version', structure: null, version: reference },
              },
              {
                expected: french,
                nextState: {
                  type: 'version',
                  structure: null,
                  version: { id: reference.id, generation: reference.generation + 1 },
                },
              },
            ],
            readSet: [],
            req,
            target,
          }),
      }),
    ).rejects.toThrow()

    expect(await readBranchHeadToken({ branchID: 'staging', req, scope, target })).toStrictEqual(
      english,
    )
    expect(
      await readBranchHeadToken({ branchID: 'staging', req, scope: french.scope, target }),
    ).toStrictEqual(french)
    expect((await payload.db.count({ collection: `${articlesSlugPrefix}-pins` })).totalDocs).toBe(0)
    expect((await payload.db.count({ collection: articleHeadsSlug })).totalDocs).toBe(0)
    expect(await readArticleVersion({ payload, versionID: reference.id })).toMatchObject({
      branchFrozen: false,
    })
  })

  test('should invalidate both old present and absent tokens after discard and recreation', async ({
    payload,
  }) => {
    const target = { collection: settingsHeadsSlug }
    const req = await createPayloadRequest({ payload })
    const absent = await readBranchHeadToken({ branchID: 'staging', req, scope, target })
    const original = await inTransaction({
      payload,
      run: ({ req }) =>
        writeBranchHead({ expected: absent, nextState: { type: 'withdrawn' }, req, target }),
    })

    expect(original).not.toBeNull()

    const oldPresent = await readBranchHeadToken({ branchID: 'staging', req, scope, target })
    const discarded = await inTransaction({
      payload,
      run: ({ req }) => discardBranchHead({ expected: oldPresent, req, target }),
    })

    expect(discarded).toMatchObject({ generation: null, incarnation: 1 })

    const recreated = await inTransaction({
      payload,
      run: ({ req }) =>
        writeBranchHead({ expected: discarded!, nextState: { type: 'withdrawn' }, req, target }),
    })

    expect(recreated).toMatchObject({ generation: 1, incarnation: 1 })
    for (const expected of [absent, oldPresent]) {
      expect(
        await inTransaction({
          payload,
          run: ({ req }) =>
            writeBranchHead({ expected, nextState: { type: 'withdrawn' }, req, target }),
        }),
      ).toBeNull()
      expect(
        await inTransaction({
          payload,
          run: ({ req }) => discardBranchHead({ expected, req, target }),
        }),
      ).toBeNull()
    }
  })

  test('should refuse writes outside an active caller transaction', async ({ payload }) => {
    const req = await createPayloadRequest({ payload })
    const target = { collection: settingsHeadsSlug }
    const expected = await readBranchHeadToken({ branchID: 'drafts', req, scope, target })

    await expect(
      writeBranchHead({ expected, nextState: { type: 'withdrawn' }, req, target }),
    ).rejects.toThrow('active caller transaction')

    const transactionID = await payload.db.beginTransaction()

    expect(transactionID).not.toBeNull()
    req.transactionID = transactionID!
    await payload.db.rollbackTransaction(transactionID!)

    await expect(
      writeBranchHead({ expected, nextState: { type: 'withdrawn' }, req, target }),
    ).rejects.toThrow('active caller transaction')
    expect((await payload.db.count({ collection: settingsHeadsSlug })).totalDocs).toBe(0)
  })

  test('should reject a stale head before freezing any new content', async ({ payload }) => {
    const { reference, target } = await createManagedAutosave({ payload })
    const req = await createPayloadRequest({ payload })
    const absent = await readBranchHeadToken({ branchID: 'staging', req, scope, target })

    await inTransaction({
      payload,
      run: ({ req }) =>
        writeBranchHead({ expected: absent, nextState: { type: 'withdrawn' }, req, target }),
    })

    const result = await inTransaction({
      payload,
      run: ({ req }) =>
        writeBranchHead({
          expected: absent,
          nextState: { type: 'version', structure: null, version: reference },
          req,
          target,
        }),
    })

    expect(result).toBeNull()
    expect(await readArticleVersion({ payload, versionID: reference.id })).toMatchObject({
      branchFrozen: false,
    })
    expect((await payload.db.count({ collection: `${articlesSlugPrefix}-pins` })).totalDocs).toBe(0)
  })

  test('should keep a branch-only identity private until a guarded publication changes visibility', async ({
    payload,
  }) => {
    const allocated = await inTransaction({
      payload,
      run: ({ req }) =>
        allocateBranchIdentity({
          branchID: 'staging',
          collection: articlesSlug,
          data: { title: { en: 'Staging identity' } },
          isLegacyDraftVisible: false,
          req,
        }),
    })
    const target = { collection: articleHeadsSlug, parentID: allocated.id }
    const req = await createPayloadRequest({ payload })
    const privateVisibility = await readBranchIdentityVisibility({ req, target })

    expect(privateVisibility).toStrictEqual({
      generation: allocated.visibility.generation,
      isLegacyDraftVisible: false,
      isPublished: false,
      ownerKey: 'string:staging',
    })
    expect(isBranchIdentityVisible({ branchID: 'staging', visibility: privateVisibility! })).toBe(
      true,
    )
    expect(isBranchIdentityVisible({ branchID: 'main', visibility: privateVisibility! })).toBe(
      false,
    )
    expect(isBranchIdentityVisible({ branchID: 'drafts', visibility: privateVisibility! })).toBe(
      false,
    )

    const published = await inTransaction({
      payload,
      run: ({ req }) =>
        updateBranchIdentityVisibility({
          expectedGeneration: allocated.visibility.generation,
          isPublished: true,
          req,
          target,
        }),
    })
    const stale = await inTransaction({
      payload,
      run: ({ req }) =>
        updateBranchIdentityVisibility({
          expectedGeneration: allocated.visibility.generation,
          isPublished: false,
          req,
          target,
        }),
    })

    expect(stale).toBeNull()
    expect(isBranchIdentityVisible({ branchID: 'main', visibility: published! })).toBe(true)
    expect(isBranchIdentityVisible({ branchID: 'drafts', visibility: published! })).toBe(true)
  })

  test('should roll back a newly allocated typed identity anchor with its visibility metadata', async ({
    payload,
  }) => {
    const allocated = await inTransaction({
      payload,
      shouldCommit: false,
      run: ({ req }) =>
        allocateBranchIdentity({
          branchID: 'staging',
          collection: articlesSlug,
          data: { title: { en: 'Temporary identity' } },
          isLegacyDraftVisible: false,
          req,
        }),
    })
    const req = await createPayloadRequest({ payload })

    expect(
      await payload.db.findOne({
        collection: articlesSlug,
        where: { id: { equals: allocated.id } },
      }),
    ).toBeNull()
    expect(
      await readBranchIdentityVisibility({
        req,
        target: { collection: articleHeadsSlug, parentID: allocated.id },
      }),
    ).toBeNull()
  })
})

const articlesSlugPrefix = `collection-${articlesSlug}`
const settingsSlugPrefix = `global-${settingsSlug}`

const autosaveGlobal = async ({ payload, title }: { payload: Payload; title: string }) => {
  const req = await createPayloadRequest({ payload, locale: 'en' })

  return updateGlobalOperation({
    autosave: true,
    data: { title },
    draft: true,
    globalConfig: payload.globals.config.find(({ slug }) => slug === settingsSlug)!,
    overrideAccess: false,
    req,
    slug: settingsSlug,
  })
}

const inTransaction = async <T>({
  payload,
  run,
  shouldCommit = true,
}: {
  payload: Payload
  run: (args: { req: PayloadRequest }) => Promise<T>
  shouldCommit?: boolean
}): Promise<T> => {
  const req = await createPayloadRequest({ payload })
  const transactionID = await payload.db.beginTransaction()

  if (transactionID === null) {
    throw new Error('The branch adapter contract requires a real caller transaction.')
  }

  req.transactionID = transactionID

  try {
    const result = await run({ req })

    if (shouldCommit) {
      await payload.db.commitTransaction(transactionID)
    } else {
      await payload.db.rollbackTransaction(transactionID)
    }

    return result
  } finally {
    if (payload.db.sessions?.[transactionID]) {
      await payload.db.rollbackTransaction(transactionID)
    }
  }
}

const createManagedAutosave = async ({
  payload,
}: {
  payload: Payload
}): Promise<{
  reference: BranchVersionReference
  target: { collection: string; parentID: number | string }
}> => {
  const article = await payload.create({
    collection: articlesSlug,
    data: { _status: 'published', title: 'Live' },
    locale: 'en',
  })

  await payload.update({
    id: article.id,
    autosave: true,
    collection: articlesSlug,
    data: { title: 'Pinned candidate' },
    draft: true,
    locale: 'en',
  })

  const versions = await payload.db.findVersions({
    collection: articlesSlug,
    limit: 1,
    locale: 'all',
    sort: '-updatedAt',
    where: { parent: { equals: article.id } },
  })
  const target = { collection: articleHeadsSlug, parentID: article.id }
  const reference = await inTransaction({
    payload,
    run: ({ req }) =>
      initializeBranchVersion({
        branchID: 'drafts',
        isFrozen: false,
        req,
        target,
        versionID: versions.docs[0]!.id,
      }),
  })

  return { reference, target }
}

const readArticleVersion = async ({
  payload,
  versionID,
}: {
  payload: Payload
  versionID: number | string
}) => {
  const result = await payload.db.findVersions({
    collection: articlesSlug,
    locale: 'all',
    where: { id: { equals: versionID } },
  })

  return result.docs[0]
}
