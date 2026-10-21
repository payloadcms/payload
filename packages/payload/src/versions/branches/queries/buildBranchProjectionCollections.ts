import { createHash } from 'node:crypto'

import type { CollectionConfig } from '../../../collections/config/types.js'
import type { Block, Field } from '../../../fields/config/types.js'

import { flattenAllFields } from '../../../utilities/flattenAllFields.js'
import { getFieldByPath } from '../../../utilities/getFieldByPath.js'

export const branchProjectionMetadataField = '_branchProjection'

/**
 * Private, rebuildable query rows. These IDs never identify ordinary content.
 * Callers must supply complete stored fields, including any generated upload/auth fields.
 */
export const buildBranchProjectionCollections = ({
  blocks = [],
  collections,
  defaultIDType,
  namespace,
  relatedProjectionSlugs = {},
}: {
  blocks?: Block[]
  collections: CollectionConfig[]
  defaultIDType: 'number' | 'text'
  namespace?: string
  relatedProjectionSlugs?: Record<string, string>
}): { collections: CollectionConfig[]; projectionSlugs: Record<string, string> } => {
  const selected = collections.filter(
    ({ versions }) => versions && typeof versions === 'object' && versions.drafts,
  )
  const projectionSlugs = Object.fromEntries(
    selected.map(({ slug }) => [slug, `collection-${slug}-projection`]),
  )
  const allSlugs = [...collections.map(({ slug }) => slug), ...Object.values(projectionSlugs)]

  if (new Set(allSlugs).size !== allSlugs.length) {
    throw new Error(
      'Internal branch projection collection slugs collide with configured collections.',
    )
  }

  const projections = selected.map((collection): CollectionConfig => {
    assertMetadataAvailable({ blocks, fields: collection.fields })

    const idField = collection.fields.find((field) => 'name' in field && field.name === 'id')
    const logicalIDType = idField?.type === 'number' ? 'number' : idField ? 'text' : defaultIDType
    const fields = cloneFields({
      blocks,
      fields: collection.fields,
      namespace: namespace ?? `collection:${collection.slug}`,
      path: [],
      projectionSlugs: { ...relatedProjectionSlugs, ...projectionSlugs },
    })

    return {
      slug: projectionSlugs[collection.slug]!,
      access: { create: () => false, delete: () => false, read: () => false, update: () => false },
      admin: { hidden: true },
      custom: { branchProjectionStorage: { collection: collection.slug } },
      dbName: privateName({ coordinates: [namespace ?? `collection:${collection.slug}`, 'root'] }),
      fields: [
        { name: 'id', type: 'text' },
        ...fields.filter((field) => !('name' in field && field.name === 'id')),
        {
          name: branchProjectionMetadataField,
          type: 'group',
          fields: [
            { name: 'branchKey', type: 'text', required: true },
            logicalIDType === 'number'
              ? { name: 'logicalID', type: 'number', required: true }
              : { name: 'logicalID', type: 'text', required: true },
            { name: 'isVisible', type: 'checkbox', required: true },
            { name: 'relationships', type: 'json' },
            { name: 'shape', type: 'json' },
            defaultIDType === 'number'
              ? { name: 'nativeGlobalID', type: 'number' }
              : { name: 'nativeGlobalID', type: 'text' },
          ],
          hidden: true,
        },
      ],
      graphQL: false,
      indexes: [
        ...buildProjectionIndexes({
          collection,
          defaultIDType,
          projectionSlugs: { ...relatedProjectionSlugs, ...projectionSlugs },
        }),
        {
          fields: [`${branchProjectionMetadataField}.logicalID`],
          unique: false,
        },
        {
          fields: [
            `${branchProjectionMetadataField}.branchKey`,
            `${branchProjectionMetadataField}.isVisible`,
          ],
        },
      ],
      lockDocuments: false,
      timestamps: false,
      versions: false,
    }
  })

  return { collections: [...collections, ...projections], projectionSlugs }
}

const assertMetadataAvailable = ({
  blocks,
  fields,
}: {
  blocks: Block[]
  fields: Field[]
}): void => {
  for (const field of fields) {
    if ('name' in field && field.name === branchProjectionMetadataField) {
      throw new Error(
        `Branch projection metadata field ${branchProjectionMetadataField} collides with content.`,
      )
    }
    if ('fields' in field) {
      assertMetadataAvailable({ blocks, fields: field.fields })
    }
    if (field.type === 'blocks') {
      for (const reference of field.blocks) {
        const block =
          typeof reference === 'string' ? blocks.find(({ slug }) => slug === reference) : reference

        if (block) {
          assertMetadataAvailable({ blocks, fields: block.fields })
        }
      }
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        assertMetadataAvailable({ blocks, fields: tab.fields })
      }
    }
  }
}

const stripBehavior = <T extends object>({ value }: { value: T }): T => {
  const cloned = { ...value } as Record<string, unknown>

  if ('unique' in value && value.unique) {
    cloned.index = true
  }

  for (const key of [
    'access',
    'admin',
    'hooks',
    'defaultValue',
    'required',
    'validate',
    'unique',
    'filterOptions',
    'min',
    'max',
    'minLength',
    'maxLength',
    'minRows',
    'maxRows',
    'dbName',
    'enumName',
    'interfaceName',
    'graphQL',
    'typescriptSchema',
    'jsonSchema',
    'custom',
    'saveToJWT',
    '_sanitized',
    'flattenedFields',
    'sanitizedMany',
  ]) {
    delete cloned[key]
  }

  return cloned as T
}

const cloneFields = ({
  blocks,
  fields,
  namespace,
  path,
  projectionSlugs,
}: {
  blocks: Block[]
  fields: Field[]
  namespace: string
  path: string[]
  projectionSlugs: Record<string, string>
}): Field[] =>
  fields
    .filter(({ type }) => type !== 'ui')
    .map((field) => {
      const cloned = stripBehavior({ value: field })
      const fieldPath = [...path, 'name' in field ? field.name : field.type]
      const name = ({ tableName }: { tableName?: string }) =>
        privateName({ coordinates: [namespace, tableName ?? '', ...fieldPath] })

      if (cloned.type === 'array' || cloned.type === 'select') {
        cloned.dbName = name
      }
      if (cloned.type === 'select' || cloned.type === 'radio') {
        cloned.enumName = ({ tableName }) =>
          privateName({ coordinates: [namespace, 'enum', tableName ?? '', ...fieldPath] })
      }

      if ('fields' in cloned) {
        cloned.fields = cloneFields({
          blocks,
          fields: cloned.fields,
          namespace,
          path: fieldPath,
          projectionSlugs,
        })
        if (cloned.type === 'array') {
          cloned.fields = withPrivateRowID({ fields: cloned.fields })
        }
      }
      if (cloned.type === 'tabs') {
        cloned.tabs = cloned.tabs.map((tab) => ({
          ...stripBehavior({ value: tab }),
          fields: cloneFields({
            blocks,
            fields: tab.fields,
            namespace,
            path: [...path, 'name' in tab && tab.name ? tab.name : 'tab'],
            projectionSlugs,
          }),
        }))
      }
      if (cloned.type === 'blocks') {
        cloned.blocks = cloned.blocks.map((reference) => {
          const block =
            typeof reference === 'string'
              ? blocks.find(({ slug }) => slug === reference)
              : reference

          if (!block) {
            throw new Error(
              `Unknown block ${typeof reference === 'string' ? reference : reference.slug} in branch projection schema.`,
            )
          }

          return {
            ...stripBehavior({ value: block }),
            dbName: ({ tableName }) =>
              privateName({ coordinates: [namespace, 'block', tableName ?? '', block.slug] }),
            fields: withPrivateRowID({
              fields: cloneFields({
                blocks,
                fields: block.fields,
                namespace,
                path: ['block', block.slug],
                projectionSlugs,
              }),
            }),
          }
        })
      }
      if (cloned.type === 'relationship' || cloned.type === 'upload') {
        cloned.index = true
        cloned.relationTo = Array.isArray(cloned.relationTo)
          ? cloned.relationTo.map((slug) =>
              Object.hasOwn(projectionSlugs, slug) ? projectionSlugs[slug]! : slug,
            )
          : Object.hasOwn(projectionSlugs, cloned.relationTo)
            ? projectionSlugs[cloned.relationTo]!
            : cloned.relationTo
      }
      if (cloned.type === 'join') {
        cloned.collection = Array.isArray(cloned.collection)
          ? cloned.collection.map((slug) =>
              Object.hasOwn(projectionSlugs, slug) ? projectionSlugs[slug]! : slug,
            )
          : Object.hasOwn(projectionSlugs, cloned.collection)
            ? projectionSlugs[cloned.collection]!
            : cloned.collection
      }

      return cloned
    })

const withPrivateRowID = ({ fields }: { fields: Field[] }): Field[] => {
  const idField = fields.find((field) => 'name' in field && field.name === 'id')
  const logicalIDField: Field =
    idField?.type === 'number'
      ? { name: 'logicalID', type: 'number', required: true }
      : { name: 'logicalID', type: 'text', required: true }

  return [
    ...fields.filter((field) => !('name' in field && field.name === 'id')),
    { name: 'id', type: 'text' },
    { name: branchProjectionMetadataField, type: 'group', fields: [logicalIDField], hidden: true },
  ]
}

/** Never widen an ordinarily valid text index tuple with a branch key or encoded FK. */
const buildProjectionIndexes = ({
  collection,
  defaultIDType,
  projectionSlugs,
}: {
  collection: CollectionConfig
  defaultIDType: 'number' | 'text'
  projectionSlugs: Record<string, string>
}): NonNullable<CollectionConfig['indexes']> => {
  const indexes: NonNullable<CollectionConfig['indexes']> = []
  const mapped = (path: string) =>
    path === 'id' ? `${branchProjectionMetadataField}.logicalID` : path
  const flattened = flattenAllFields({ fields: collection.fields })
  const resolve = (path: string) => getFieldByPath({ fields: flattened, path })
  const field = (path: string) => resolve(path)?.field
  const isBounded = (path: string): boolean => {
    const resolved = resolve(path)
    if (resolved?.pathHasLocalized) {
      return false
    }
    return path === 'id' && !resolved
      ? defaultIDType === 'number'
      : Boolean(resolved && ['checkbox', 'date', 'number', 'select'].includes(resolved.field.type))
  }
  const isExpanded = (path: string): boolean => {
    const resolved = field(path)
    return Boolean(
      resolved &&
      (resolved.type === 'relationship' || resolved.type === 'upload') &&
      (Array.isArray(resolved.relationTo) ? resolved.relationTo : [resolved.relationTo]).some(
        (slug) => projectionSlugs[slug],
      ),
    )
  }
  for (const index of collection.indexes ?? []) {
    const paths = index.fields.map(mapped)
    if (paths.length > 1 && index.fields.some(isExpanded)) {
      indexes.push(...paths.map((path) => ({ fields: [path], unique: false })))
    } else {
      indexes.push({ fields: paths, unique: false })
    }
    if (index.fields.every(isBounded)) {
      indexes.push({
        fields: [`${branchProjectionMetadataField}.branchKey`, ...paths],
        unique: false,
      })
    }
  }
  const collect = ({ fields, prefix = '' }: { fields: Field[]; prefix?: string }): void => {
    for (const value of fields) {
      if ('name' in value) {
        const path = `${prefix}${value.name}`
        if ('index' in value && value.index && isBounded(path)) {
          indexes.push({
            fields: [`${branchProjectionMetadataField}.branchKey`, mapped(path)],
            unique: false,
          })
        }
        if ('fields' in value && value.type !== 'array') {
          collect({ fields: value.fields, prefix: `${path}.` })
        }
      } else if ('fields' in value) {
        collect({ fields: value.fields, prefix })
      }
    }
  }
  collect({ fields: collection.fields })
  return indexes.filter(
    (index, position) =>
      indexes.findIndex(
        (candidate) => JSON.stringify(candidate.fields) === JSON.stringify(index.fields),
      ) === position,
  )
}

const privateName = ({ coordinates }: { coordinates: string[] }): string =>
  `bq_${createHash('sha256').update(JSON.stringify(coordinates)).digest('hex').slice(0, 24)}`
