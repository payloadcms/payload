import type { JSONSchema4 } from 'json-schema'
import type { CollectionSlug, DataFromCollectionSlug, UploadCollectionSlug } from 'payload'

import type { LexicalElementFormat } from '../../../types/nodeTypes.js'
import type { JSONSchemaFn } from '../../typesServer.js'
import type { RelationshipFeatureProps } from './index.js'

import { formatSchema, versionSchema } from '../../../types/jsonSchemaHelpers.js'
import { filterEnabledRelationshipCollections } from '../shared/filterEnabledRelationshipCollections.js'

export type RelationshipData = {
  [TCollectionSlug in CollectionSlug]: {
    relationTo: TCollectionSlug
    value: DataFromCollectionSlug<TCollectionSlug> | number | string
  }
}[CollectionSlug]

/**
 * Exclude upload collection slugs. This matches runtime behavior, as well as the json schema.
 */
export type NonUploadCollectionSlug = [Exclude<CollectionSlug, UploadCollectionSlug>] extends [
  never,
]
  ? CollectionSlug
  : Exclude<CollectionSlug, UploadCollectionSlug>

export type SerializedRelationshipNode<TSlugs extends CollectionSlug = NonUploadCollectionSlug> = {
  [TSlug in TSlugs]: {
    relationTo: TSlug
    value: DataFromCollectionSlug<TSlug> | number | string
  }
}[TSlugs] & {
  format: LexicalElementFormat
  type: 'relationship'
  version: number
}

/** MUST stay byte-for-byte in sync with the runtime `SerializedRelationshipNode` declared above. */
const SERIALIZED_RELATIONSHIP_NODE_TS = `export type SerializedRelationshipNode<TSlugs extends keyof Config['collections']> = {
  type: 'relationship';
  format: LexicalElementFormat;
  version: number;
} & {
  [TSlug in TSlugs]: {
    relationTo: TSlug;
    value: number | string | Config['collections'][TSlug];
  };
}[TSlugs];`

/** Input variant of `SerializedRelationshipNode`: `value` is ID-only (you only ever write an ID). */
const SERIALIZED_RELATIONSHIP_NODE_INPUT_TS = `export type SerializedRelationshipNodeInput<TSlugs extends keyof Config['collections']> = {
  type: 'relationship';
  format: LexicalElementFormat;
  version: number;
} & {
  [TSlug in TSlugs]: {
    relationTo: TSlug;
    value: number | string;
  };
}[TSlugs];`

export const createRelationshipNodeJSONSchema =
  (props: RelationshipFeatureProps | undefined): JSONSchemaFn =>
  ({ collectionIDFieldTypes, config, typeStringDefinitions, variant }) => {
    const isInput = variant === 'input'
    typeStringDefinitions.add(
      isInput ? SERIALIZED_RELATIONSHIP_NODE_INPUT_TS : SERIALIZED_RELATIONSHIP_NODE_TS,
    )
    const enabledCollections = config?.collections
      ? filterEnabledRelationshipCollections(config.collections, {
          disabledCollections: props?.disabledCollections,
          enabledCollections: props?.enabledCollections,
          uploads: false,
        })
      : []

    const variants: JSONSchema4[] = enabledCollections.map((collection) => {
      const slug = collection.slug
      const idType: 'number' | 'string' = collectionIDFieldTypes[slug] ?? 'string'
      return {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string', const: 'relationship' },
          format: formatSchema,
          relationTo: { type: 'string', const: slug },
          value: isInput
            ? { type: idType, description: 'The related document ID.' }
            : {
                description:
                  'The related document by ID (string or number). Populated to the full document when read at depth > 0.',
                oneOf: [{ type: idType }, { $ref: `#/$defs/${slug}` }],
              },
          version: versionSchema,
        },
        required: ['format', 'relationTo', 'type', 'value', 'version'],
      }
    })

    let schema: JSONSchema4
    if (variants.length === 0) {
      schema = {
        type: 'object',
        additionalProperties: true,
        properties: {
          type: { type: 'string', const: 'relationship' },
          version: versionSchema,
        },
        required: ['type', 'version'],
      }
    } else {
      const slugUnion = enabledCollections.map((c) => `'${c.slug}'`).join(' | ')
      const baseSchema: JSONSchema4 = variants.length === 1 ? variants[0]! : { oneOf: variants }
      const tsName = isInput ? 'SerializedRelationshipNodeInput' : 'SerializedRelationshipNode'
      schema = { ...baseSchema, tsType: `${tsName}<${slugUnion}>` }
    }

    return schema
  }
