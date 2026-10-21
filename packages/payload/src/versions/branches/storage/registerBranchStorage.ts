import type { CollectionConfig } from '../../../collections/config/types.js'
import type { Field, FlattenedField } from '../../../fields/config/types.js'
import type { GlobalConfig } from '../../../globals/config/types.js'

import { buildBranchHeadCollection } from './buildBranchHeadCollection.js'

/** Internal schema preparation only; this does not activate branch reads or writes. */
export const registerBranchStorage = ({
  collections,
  globals,
  versionIDType,
}: {
  collections: CollectionConfig[]
  globals: GlobalConfig[]
  versionIDType: 'number' | 'text'
}): { collections: CollectionConfig[]; globals: GlobalConfig[] } => {
  const storageCollections: CollectionConfig[] = []
  const register = <T extends CollectionConfig | GlobalConfig>({
    entity,
    isGlobal,
  }: {
    entity: T
    isGlobal: boolean
  }): T => {
    if (!entity.versions || typeof entity.versions !== 'object' || !entity.versions.drafts) {
      return entity
    }

    const prefix = `${isGlobal ? 'global' : 'collection'}-${entity.slug}`
    const storage = {
      heads: `${prefix}-heads`,
      identities: `${prefix}-identities`,
      pins: `${prefix}-pins`,
    }
    const parentCollection = isGlobal ? undefined : entity.slug
    const globalSlug = isGlobal ? entity.slug : undefined
    const parentFields: Field[] = parentCollection
      ? [{ name: 'parent', type: 'relationship', relationTo: parentCollection, required: true }]
      : []
    const internal = {
      access: { create: () => false, delete: () => false, read: () => false, update: () => false },
      admin: { hidden: true },
      graphQL: false,
      lockDocuments: false,
      timestamps: false,
      versions: false,
    } as const

    storageCollections.push(
      buildBranchHeadCollection({
        slug: storage.heads,
        globalSlug,
        parentCollection,
        versionIDType,
      }),
      {
        ...internal,
        slug: storage.pins,
        custom: {
          branchPinStorage: {
            globalSlug: globalSlug ?? null,
            parentCollection: parentCollection ?? null,
          },
        },
        fields: [
          ...parentFields,
          ...(versionIDType === 'number'
            ? [{ name: 'versionID', type: 'number', required: true } satisfies Field]
            : [{ name: 'versionID', type: 'text', required: true } satisfies Field]),
          { name: 'versionGeneration', type: 'number', required: true },
          { name: 'rootKey', type: 'text', required: true },
        ],
        indexes: [
          {
            fields: [...(parentCollection ? ['parent'] : []), 'versionID', 'rootKey'],
            unique: true,
          },
          { fields: ['versionID'] },
        ],
      },
      {
        ...internal,
        slug: storage.identities,
        custom: {
          branchIdentityStorage: {
            globalSlug: globalSlug ?? null,
            parentCollection: parentCollection ?? null,
          },
        },
        fields: [
          ...parentFields,
          { name: 'singleton', type: 'text', required: true },
          { name: 'generation', type: 'number', required: true },
          { name: 'ownerKey', type: 'text', required: true },
          { name: 'isPublished', type: 'checkbox', required: true },
          { name: 'isLegacyDraftVisible', type: 'checkbox', required: true },
        ],
        indexes: [{ fields: parentCollection ? ['parent'] : ['singleton'], unique: true }],
      },
    )

    return { ...entity, custom: { ...entity.custom, branchStorage: storage } }
  }
  const nextCollections = collections.map((entity) => register({ entity, isGlobal: false }))
  const nextGlobals = globals.map((entity) => register({ entity, isGlobal: true }))

  const slugs = [...nextCollections, ...storageCollections].map(({ slug }) => slug)

  if (new Set(slugs).size !== slugs.length) {
    throw new Error('Internal branch storage collection slugs collide with configured collections.')
  }

  return { collections: [...nextCollections, ...storageCollections], globals: nextGlobals }
}

export const buildBranchVersionFields = (): FlattenedField[] => [
  { name: 'branchOnly', type: 'checkbox', hidden: true },
  { name: 'branchGeneration', type: 'number', hidden: true },
  { name: 'branchFrozen', type: 'checkbox', hidden: true },
  { name: 'branchOwnerKey', type: 'text', hidden: true },
]
