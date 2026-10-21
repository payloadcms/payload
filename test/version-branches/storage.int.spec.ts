/* eslint-disable payload/no-relative-monorepo-imports -- Exercise the internal store against native adapters before exposing runtime APIs. */
import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import type { BranchHeadState } from '../../packages/payload/src/versions/branches/types.js'

import {
  readBranchHead,
  writeBranchHead,
} from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import { test } from '../__helpers/int/vitest.js'
import { articleHeadsSlug, articlesSlug, settingsHeadsSlug } from './slugs.js'

const scope = { locale: 'en', type: 'locale' as const }

test.suite('Native branch head storage', { config: './config.ts' }, () => {
  test('should persist a head with the logical parent and typed version identity', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { title: 'working' },
      draft: true,
    })
    const versions = await payload.findVersions({
      collection: articlesSlug,
      where: { parent: { equals: article.id } },
    })
    const versionID = versions.docs[0]!.id
    const req = await createPayloadRequest({ payload })
    const target = { collection: articleHeadsSlug, parentID: article.id }
    const written = await writeBranchHead({
      expected: { branchID: 'drafts', generation: null, scope, state: null },
      nextState: { structure: null, type: 'version', version: { generation: 1, id: versionID } },
      req,
      target,
    })
    const read = await readBranchHead({ branchID: 'drafts', req, scope, target })

    expect(read).toStrictEqual(written)
    expect(read?.generation).toBe(1)
    expect(read?.state).toStrictEqual({
      structure: null,
      type: 'version',
      version: { generation: 1, id: versionID },
    })
  })

  test('should allow exactly one writer to advance the same generation', async ({ payload }) => {
    const req = await createPayloadRequest({ payload })
    const target = { collection: settingsHeadsSlug }
    const initial = await writeBranchHead({
      expected: { branchID: 'staging', generation: null, scope, state: null },
      nextState: { type: 'withdrawn' },
      req,
      target,
    })

    expect(initial).not.toBeNull()

    const expected = {
      branchID: 'staging',
      generation: initial!.generation,
      scope,
      state: initial!.state,
    }
    const results = await Promise.all([
      writeBranchHead({ expected, nextState: { type: 'withdrawn' }, req, target }),
      writeBranchHead({ expected, nextState: { type: 'withdrawn' }, req, target }),
    ])

    expect(results.filter(Boolean)).toHaveLength(1)
    expect(results.filter((result) => result === null)).toHaveLength(1)
    expect((await readBranchHead({ branchID: 'staging', req, scope, target }))?.generation).toBe(2)
  })

  test('should prevent duplicate first heads through the native unique constraint', async ({
    payload,
  }) => {
    const req = await createPayloadRequest({ payload })
    const target = { collection: settingsHeadsSlug }
    const results = await Promise.allSettled([
      writeBranchHead({
        expected: { branchID: 'drafts', generation: null, scope, state: null },
        nextState: { type: 'withdrawn' },
        req,
        target,
      }),
      writeBranchHead({
        expected: { branchID: 'drafts', generation: null, scope, state: null },
        nextState: { type: 'withdrawn' },
        req,
        target,
      }),
    ])

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(1)
    expect((await payload.db.count({ collection: settingsHeadsSlug })).totalDocs).toBe(1)
  })

  test('should preserve the captured base and clear all content references on withdrawal', async ({
    payload,
  }) => {
    const req = await createPayloadRequest({ payload })
    const target = { collection: settingsHeadsSlug }
    const base = { branchID: 'main', generation: null, scope, state: null } as const
    const versionID = payload.db.defaultIDType === 'number' ? 1 : 'version'
    const initial = await writeBranchHead({
      base,
      expected: { branchID: 'drafts', generation: null, scope, state: null },
      nextState: {
        structure: { generation: 1, id: versionID },
        type: 'version',
        version: { generation: 1, id: versionID },
      },
      req,
      target,
    })
    const withdrawn = await writeBranchHead({
      expected: {
        branchID: 'drafts',
        generation: initial!.generation,
        scope,
        state: initial!.state,
      },
      nextState: { type: 'withdrawn' },
      req,
      target,
    })

    expect(withdrawn?.base).toStrictEqual(base)
    expect(withdrawn?.state).toStrictEqual({ type: 'withdrawn' })
    expect(withdrawn?.generation).toBe(2)
  })

  test('should keep numeric and string branch identities separate', async ({ payload }) => {
    const req = await createPayloadRequest({ payload })
    const target = { collection: settingsHeadsSlug }

    await writeBranchHead({
      expected: { branchID: 1, generation: null, scope, state: null },
      nextState: { type: 'withdrawn' },
      req,
      target,
    })
    await writeBranchHead({
      expected: { branchID: '1', generation: null, scope, state: null },
      nextState: { type: 'withdrawn' },
      req,
      target,
    })

    expect((await payload.db.count({ collection: settingsHeadsSlug })).totalDocs).toBe(2)
    expect((await readBranchHead({ branchID: 1, req, scope, target }))?.branchID).toBe(1)
    expect((await readBranchHead({ branchID: '1', req, scope, target }))?.branchID).toBe('1')
  })

  test('should refuse nonzero incarnation guards until durable discard storage is implemented', async ({
    payload,
  }) => {
    const req = await createPayloadRequest({ payload })
    const target = { collection: settingsHeadsSlug }

    for (const hasBaseGuard of [false, true]) {
      await expect(
        writeBranchHead({
          base: hasBaseGuard
            ? { branchID: 'main', generation: null, incarnation: 1, scope, state: null }
            : null,
          expected: {
            branchID: 'drafts',
            generation: null,
            incarnation: hasBaseGuard ? 0 : 1,
            scope,
            state: null,
          },
          nextState: { type: 'withdrawn' },
          req,
          target,
        }),
      ).rejects.toThrow('Durable branch incarnation persistence is required')
    }

    expect((await payload.db.count({ collection: settingsHeadsSlug })).totalDocs).toBe(0)
  })

  test('should refuse ordinary user access to the internal storage', async ({ payload }) => {
    await expect(
      payload.create({
        collection: settingsHeadsSlug,
        data: { branchKey: 'string:main', generation: 1, scopeKey: 'shared', state: 'withdrawn' },
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  test('should reject missing parent IDs and ordinary collections as store targets', async ({
    payload,
  }) => {
    const req = await createPayloadRequest({ payload })

    await expect(
      readBranchHead({ branchID: 'main', req, scope, target: { collection: articleHeadsSlug } }),
    ).rejects.toThrow('parent identity')
    await expect(
      readBranchHead({ branchID: 'main', req, scope, target: { collection: articlesSlug } }),
    ).rejects.toThrow('registered internal head storage')
  })

  test('should reject invalid revisions before writing a head', async ({ payload }) => {
    const req = await createPayloadRequest({ payload })
    const nextState: BranchHeadState = {
      structure: null,
      type: 'version',
      version: { generation: 0, id: 1 },
    }

    await expect(
      writeBranchHead({
        expected: { branchID: 'drafts', generation: null, scope, state: null },
        nextState,
        req,
        target: { collection: settingsHeadsSlug },
      }),
    ).rejects.toThrow('positive safe integers')
    expect((await payload.db.count({ collection: settingsHeadsSlug })).totalDocs).toBe(0)
  })
})
