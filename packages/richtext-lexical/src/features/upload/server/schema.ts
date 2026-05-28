import type { JSONSchema4 } from 'json-schema'
import type {
  DataFromCollectionSlug,
  JsonObject,
  TypedUploadCollection,
  UploadCollectionSlug,
} from 'payload'

import { fieldsToJSONSchema, flattenAllFields } from 'payload'

import type { LexicalElementFormat } from '../../../types/nodeTypes.js'
import type { JSONSchemaFn } from '../../typesServer.js'
import type { UploadFeatureProps } from './index.js'

import { formatSchema } from '../../../types/jsonSchemaHelpers.js'
import { filterEnabledRelationshipCollections } from '../../relationship/shared/filterEnabledRelationshipCollections.js'

export type UploadData<TFields extends JsonObject = JsonObject> = {
  [TCollectionSlug in UploadCollectionSlug]: {
    fields: TFields
    /** ID of this upload node — NOT the linked document's ID. */
    id: string
    relationTo: TCollectionSlug
    /** Either the document ID or the full populated document. */
    value: DataFromCollectionSlug<TCollectionSlug> | number | string
  }
}[UploadCollectionSlug]

/** @internal Adds a pending state to `UploadData`. */
export type Internal_UploadData<TFields extends JsonObject = JsonObject> = {
  pending?: {
    /** Bulk upload form ID. */
    formID: string
    /** `src` of the image DOM element. */
    src: string
  }
} & UploadData<TFields>

/**
 * More precise variant of {@link UploadData}. Replaces `UploadData` in v4.
 * @internal
 * @todo Replace UploadData with UploadDataImproved in 4.0
 */
export type UploadDataImproved<TFields extends JsonObject = JsonObject> = {
  [TCollectionSlug in UploadCollectionSlug]: {
    fields: TFields
    id: string
    relationTo: TCollectionSlug
    value: number | string | TypedUploadCollection[TCollectionSlug]
  }
}[UploadCollectionSlug]

export type SerializedUploadNode<TSlugs extends UploadCollectionSlug = UploadCollectionSlug> = {
  [TSlug in TSlugs]: {
    relationTo: TSlug
    value: DataFromCollectionSlug<TSlug> | number | string
  }
}[TSlugs] & {
  fields: { [k: string]: unknown }
  format: LexicalElementFormat
  id: string
  type: 'upload'
  version: number
}

/** MUST stay byte-for-byte in sync with the runtime `SerializedUploadNode` declared above. */
const SERIALIZED_UPLOAD_NODE_TS = `export type SerializedUploadNode<TSlugs extends keyof Config['collections']> = {
  type: 'upload';
  format: LexicalElementFormat;
  id: string;
  version: number;
  fields: { [k: string]: unknown };
} & {
  [TSlug in TSlugs]: {
    relationTo: TSlug;
    value: number | string | Config['collections'][TSlug];
  };
}[TSlugs];`

export const createUploadNodeJSONSchema =
  (props: undefined | UploadFeatureProps): JSONSchemaFn =>
  ({ collectionIDFieldTypes, config, i18n, interfaceNameDefinitions, typeStringDefinitions }) => {
    typeStringDefinitions.add(SERIALIZED_UPLOAD_NODE_TS)
    const enabledCollections = config?.collections
      ? filterEnabledRelationshipCollections(config.collections, {
          disabledCollections: props?.disabledCollections,
          enabledCollections: props?.enabledCollections,
          uploads: true,
        })
      : []

    const collectionVariants: JSONSchema4[] = enabledCollections.map((collection) => {
      const slug = collection.slug
      const idType: 'number' | 'string' = collectionIDFieldTypes[slug] ?? 'string'
      const extraFields = props?.collections?.[slug]?.fields ?? []
      const flattenedExtra = flattenAllFields({ fields: extraFields })
      const extraFieldsSchema =
        flattenedExtra.length > 0 && config
          ? fieldsToJSONSchema({
              collectionIDFieldTypes,
              config,
              fields: flattenedExtra,
              i18n,
              interfaceNameDefinitions,
              typeStringDefinitions,
            })
          : { properties: {}, required: [] }

      return {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          type: { type: 'string', const: 'upload' },
          fields: {
            type: 'object',
            additionalProperties: false,
            properties: extraFieldsSchema.properties,
            required: extraFieldsSchema.required,
          },
          format: formatSchema,
          relationTo: { type: 'string', const: slug },
          value: {
            oneOf: [{ type: idType }, { $ref: `#/definitions/${slug}` }],
          },
          version: { type: 'integer' },
        },
        required: ['fields', 'format', 'id', 'relationTo', 'type', 'value', 'version'],
      }
    })

    let schema: JSONSchema4
    if (collectionVariants.length === 0) {
      // Fallback when no enabled upload collections.
      schema = {
        type: 'object',
        additionalProperties: true,
        properties: {
          type: { type: 'string', const: 'upload' },
          version: { type: 'integer' },
        },
        required: ['type', 'version'],
      }
    } else {
      const slugUnion = enabledCollections.map((c) => `'${c.slug}'`).join(' | ')
      const baseSchema: JSONSchema4 =
        collectionVariants.length === 1 ? collectionVariants[0]! : { oneOf: collectionVariants }
      schema = { ...baseSchema, tsType: `SerializedUploadNode<${slugUnion}>` }
    }

    return schema
  }
