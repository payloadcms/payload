/* eslint-disable payload/no-relative-monorepo-imports -- Actual adapter factory admission before initialization. */
import type { PayloadRequest } from 'payload'

import { buildConfig } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { registerBranchQueryStorage } from '../../../payload/src/versions/branches/queries/registerBranchQueryStorage.js'
import { prepareBranchContentQuery } from '../../../payload/src/versions/branches/queries/queryBranchContent.js'
import { maintainBranchProjections } from '../../../payload/src/versions/branches/queries/branchProjectionStore.js'
import { registerBranchStorage } from '../../../payload/src/versions/branches/storage/registerBranchStorage.js'
import { mongooseAdapter } from '../index.js'

describe('Mongo additional-key branch admission', () => {
  it('should reject the actual additional-key factory before schema-only projection registration', async () => {
    const db = mongooseAdapter({ allowAdditionalKeys: true, url: 'mongodb://unused.test/payload' })
    const registered = registerBranchQueryStorage(
      registerBranchStorage({
        collections: [{ slug: 'articles', fields: [], versions: { drafts: true } }],
        globals: [],
        versionIDType: 'text',
      }),
    )

    expect(Object.getOwnPropertyDescriptor(db, 'allowAdditionalKeys')).toMatchObject({
      value: true,
      writable: false,
    })
    await expect(buildConfig({ db, secret: 'admission', ...registered })).rejects.toMatchObject({
      code: 'branch-additional-keys-unsupported',
    })
    await expect(
      buildConfig({
        db,
        secret: 'legacy',
        collections: [{ slug: 'articles', fields: [], versions: { drafts: true } }],
      }),
    ).resolves.toBeDefined()
  })

  it('should reject initialized query and maintenance entrypoints before native I/O', async () => {
    const nativeRead = vi.fn()
    const req = {
      payload: {
        db: {
          allowAdditionalKeys: true,
          defaultIDType: 'text',
          find: nativeRead,
          branching: { queryProjection: {} },
        },
        collections: { articles: { config: { custom: { branchQueryStorage: {} } } } },
      },
    } as unknown as PayloadRequest

    await expect(
      prepareBranchContentQuery({ branchID: 'drafts', collection: 'articles', req }),
    ).rejects.toMatchObject({ code: 'branch-additional-keys-unsupported' })
    // A configured target is needed only to reach the maintenance admission boundary.
    req.payload.collections.heads = {
      config: { custom: { branchHeadStorage: { parentCollection: 'articles' } } },
    } as never
    req.payload.collections.articles!.config.custom.branchStorage = {
      heads: 'heads',
      pins: 'pins',
      identities: 'identities',
    }
    await expect(
      maintainBranchProjections({
        branchID: 'drafts',
        req,
        target: { collection: 'heads', parentID: 'one' },
      }),
    ).rejects.toMatchObject({ code: 'branch-additional-keys-unsupported' })
    expect(nativeRead).not.toHaveBeenCalled()
  })
})
