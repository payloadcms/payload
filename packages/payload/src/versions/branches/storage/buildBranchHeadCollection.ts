import type { CollectionConfig } from '../../../collections/config/types.js'
import type { Field } from '../../../fields/config/types.js'

/** Internal schema only. Registration does not activate branch reads, writes, or engine cutover. */
export const buildBranchHeadCollection = ({
  slug,
  globalSlug,
  parentCollection,
  versionIDType,
}: {
  globalSlug?: string
  parentCollection?: string
  slug: string
  versionIDType: 'number' | 'text'
}): CollectionConfig => {
  const versionIDField = ({ name }: { name: string }): Field =>
    versionIDType === 'number' ? { name, type: 'number' } : { name, type: 'text' }

  return {
    slug,
    access: {
      create: () => false,
      delete: () => false,
      read: () => false,
      update: () => false,
    },
    admin: { hidden: true },
    custom: {
      branchHeadStorage: {
        globalSlug: globalSlug ?? null,
        parentCollection: parentCollection ?? null,
      },
    },
    disableDuplicate: true,
    fields: [
      ...(parentCollection
        ? [
            {
              name: 'parent',
              type: 'relationship',
              relationTo: parentCollection,
              required: true,
            } satisfies Field,
          ]
        : []),
      { name: 'branchKey', type: 'text', required: true },
      { name: 'scopeKey', type: 'text', required: true },
      { name: 'generation', type: 'number', min: 1 },
      { name: 'incarnation', type: 'number', defaultValue: 0, min: 0, required: true },
      { name: 'lockNonce', type: 'text' },
      {
        name: 'state',
        type: 'select',
        options: ['absent', 'version', 'withdrawn'],
        required: true,
      },
      versionIDField({ name: 'versionID' }),
      { name: 'versionGeneration', type: 'number', min: 1 },
      versionIDField({ name: 'structureVersionID' }),
      { name: 'structureVersionGeneration', type: 'number', min: 1 },
      { name: 'base', type: 'json' },
    ],
    graphQL: false,
    indexes: [
      { fields: [...(parentCollection ? ['parent'] : []), 'branchKey', 'scopeKey'], unique: true },
      { fields: ['branchKey', 'state'] },
      { fields: ['versionID'] },
      { fields: ['structureVersionID'] },
    ],
    lockDocuments: false,
    timestamps: false,
    versions: false,
  }
}
