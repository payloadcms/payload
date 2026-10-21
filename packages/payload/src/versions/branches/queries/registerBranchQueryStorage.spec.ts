import type { Config } from '../../../config/types.js'

import { describe, expect, it } from 'vitest'

import { sanitizeConfig } from '../../../config/sanitize.js'
import { registerBranchStorage } from '../storage/registerBranchStorage.js'
import { registerBranchQueryStorage } from './registerBranchQueryStorage.js'

describe('Expanded private branch query schemas', () => {
  it('should keep collection and global projection namespaces independent', () => {
    const registered = registerBranchQueryStorage(
      registerBranchStorage({
        collections: [
          {
            slug: 'global-header',
            fields: [{ name: 'title', type: 'text' }],
            versions: { drafts: true },
          },
        ],
        globals: [
          {
            slug: 'header',
            fields: [{ name: 'related', type: 'relationship', relationTo: 'global-header' }],
            versions: { drafts: true },
          },
        ],
        versionIDType: 'number',
      }),
    )
    const config = sanitizeConfig({
      db: { defaultIDType: 'number', init: () => undefined } as unknown as Config['db'],
      secret: 'projection schema tests',
      ...registered,
    })
    const collection = config.collections.find(
      ({ slug }) => slug === 'collection-global-header-projection',
    )!
    const global = config.collections.find(({ slug }) => slug === 'global-header-projection')!

    expect(collection).toBeDefined()
    expect(global).toBeDefined()
    expect(global.fields).toContainEqual(
      expect.objectContaining({ name: 'related', relationTo: collection.slug }),
    )
    expect(global.custom).toMatchObject({ branchProjectionStorage: { global: 'header' } })
    expect(global.fields).toContainEqual(
      expect.objectContaining({
        name: '_branchProjection',
        fields: expect.arrayContaining([
          expect.objectContaining({ name: 'logicalID', type: 'text' }),
        ]),
      }),
    )
  })

  it('should include generated stored auth upload and timestamp fields without application hooks', () => {
    const registered = registerBranchQueryStorage(
      registerBranchStorage({
        collections: [
          {
            slug: 'members',
            auth: true,
            fields: [{ name: 'name', type: 'text' }],
            versions: { drafts: true },
          },
          { slug: 'media', upload: true, fields: [], versions: { drafts: true } },
        ],
        globals: [],
        versionIDType: 'number',
      }),
    )
    const config = sanitizeConfig({
      db: { defaultIDType: 'number', init: () => undefined } as unknown as Config['db'],
      secret: 'projection schema tests',
      ...registered,
    })
    const member = config.collections.find(({ slug }) => slug === 'collection-members-projection')!
    const media = config.collections.find(({ slug }) => slug === 'collection-media-projection')!

    expect(member.fields).toEqual(
      expect.arrayContaining(
        ['email', 'createdAt', 'updatedAt', '_status'].map((name) =>
          expect.objectContaining({ name }),
        ),
      ),
    )
    expect(media.fields).toEqual(
      expect.arrayContaining(
        ['filename', 'mimeType', 'filesize', 'createdAt'].map((name) =>
          expect.objectContaining({ name }),
        ),
      ),
    )
    expect(member.auth).toBe(false)
    expect(media.upload).toBe(false)
    expect(member.hooks.afterChange).toEqual([])
  })
  it('should reject additional-key branch registration before any schema-only migration can omit content', () => {
    const registered = registerBranchQueryStorage(
      registerBranchStorage({
        collections: [{ slug: 'articles', fields: [], versions: { drafts: true } }],
        globals: [],
        versionIDType: 'text',
      }),
    )
    expect(() =>
      sanitizeConfig({
        db: {
          defaultIDType: 'text',
          allowAdditionalKeys: true,
          init: () => undefined,
        } as unknown as Config['db'],
        secret: 'projection schema tests',
        ...registered,
      }),
    ).toThrow('schema-complement ownership')
    expect(() =>
      sanitizeConfig({
        db: {
          defaultIDType: 'text',
          allowAdditionalKeys: true,
          init: () => undefined,
        } as unknown as Config['db'],
        secret: 'legacy additional keys',
        collections: [{ slug: 'articles', fields: [], versions: { drafts: true } }],
      }),
    ).not.toThrow()
  })
})
