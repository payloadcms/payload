import type { JSONSchema4 } from 'json-schema'
import type {
  DataFromCollectionSlug,
  JsonObject,
  TypedUploadCollection,
  UploadCollectionSlug,
} from 'payload'

import { createHash } from 'crypto'
import { fieldsToJSONSchema, flattenAllFields } from 'payload'

import type { LexicalElementFormat } from '../../../types/nodeTypes.js'
import type { JSONSchemaFn } from '../../typesServer.js'
import type { UploadFeatureProps } from './index.js'

import { formatSchema, versionSchema } from '../../../types/jsonSchemaHelpers.js'
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

export type SerializedUploadNode<
  TSlugs extends UploadCollectionSlug = UploadCollectionSlug,
  TFields = { [k: string]: unknown },
> = {
  [TSlug in TSlugs]: {
    relationTo: TSlug
    value: DataFromCollectionSlug<TSlug> | number | string
  }
}[TSlugs] & {
  fields: TFields
  format: LexicalElementFormat
  id: string
  type: 'upload'
  version: number
}

/** MUST stay byte-for-byte in sync with the runtime `SerializedUploadNode` declared above. */
const SERIALIZED_UPLOAD_NODE_TS = `export type SerializedUploadNode<TSlugs extends keyof Config['collections'], TFields = { [k: string]: unknown }> = {
  type: 'upload';
  format: LexicalElementFormat;
  id: string;
  version: number;
  fields: TFields;
} & {
  [TSlug in TSlugs]: {
    relationTo: TSlug;
    value: number | string | Config['collections'][TSlug];
  };
}[TSlugs];`

/** Input variant of `SerializedUploadNode`: `value` is ID-only (you only ever write an ID). */
const SERIALIZED_UPLOAD_NODE_INPUT_TS = `export type SerializedUploadNodeInput<TSlugs extends keyof Config['collections'], TFields = { [k: string]: unknown }> = {
  type: 'upload';
  format: LexicalElementFormat;
  id: string;
  version: number;
  fields: TFields;
} & {
  [TSlug in TSlugs]: {
    relationTo: TSlug;
    value: number | string;
  };
}[TSlugs];`

const hashUploadFields = (schema: JSONSchema4): string =>
  createHash('sha256').update(JSON.stringify(schema)).digest('hex').slice(0, 8).toUpperCase()

export const createUploadNodeJSONSchema =
  (props: undefined | UploadFeatureProps): JSONSchemaFn =>
  ({
    collectionIDFieldTypes,
    config,
    i18n,
    interfaceNameDefinitions,
    typeStringDefinitions,
    variant,
  }) => {
    const isInput = variant === 'input'
    typeStringDefinitions.add(isInput ? SERIALIZED_UPLOAD_NODE_INPUT_TS : SERIALIZED_UPLOAD_NODE_TS)
    const enabledCollections = config?.collections
      ? filterEnabledRelationshipCollections(config.collections, {
          disabledCollections: props?.disabledCollections,
          enabledCollections: props?.enabledCollections,
          uploads: true,
        })
      : []

    // Configured extra fields are registered as their own interface and referenced here, so the
    // generated TypeScript keeps them - the node-level `tsType` would otherwise erase `fields` to
    // `{ [k: string]: unknown }`. Mirrors how LinkFeature handles custom link fields.
    //
    // Each collection gets its own `SerializedUploadNode<'slug', Fields>` instantiation so the
    // generated union correctly pairs each `relationTo` with its own fields type. A single
    // `SerializedUploadNode<'a' | 'b', AFields | BFields>` would lose that pairing.
    const perCollectionTsTypes: string[] = []
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
              variant,
            })
          : { properties: {}, required: [] }

      let fieldsSchema: JSONSchema4 = {
        type: 'object',
        additionalProperties: false,
        properties: extraFieldsSchema.properties,
        required: extraFieldsSchema.required,
      }
      let fieldsTypeName: string | undefined
      if (flattenedExtra.length > 0) {
        fieldsTypeName = `LexicalUploadFields_${hashUploadFields(fieldsSchema)}`
        interfaceNameDefinitions.set(fieldsTypeName, fieldsSchema)
        fieldsSchema = { $ref: `#/$defs/${fieldsTypeName}` }
      }

      const uploadTsName = isInput ? 'SerializedUploadNodeInput' : 'SerializedUploadNode'
      perCollectionTsTypes.push(
        fieldsTypeName
          ? `${uploadTsName}<'${slug}', ${fieldsTypeName}>`
          : `${uploadTsName}<'${slug}'>`,
      )

      return {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          type: { type: 'string', const: 'upload' },
          fields: fieldsSchema,
          format: formatSchema,
          relationTo: { type: 'string', const: slug },
          value: isInput
            ? { type: idType, description: 'The uploaded file ID.' }
            : {
                description:
                  'The uploaded file by ID (string or number). Populated to the full upload document when read at depth > 0.',
                oneOf: [{ type: idType }, { $ref: `#/$defs/${slug}` }],
              },
          version: versionSchema,
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
          version: versionSchema,
        },
        required: ['type', 'version'],
      }
    } else {
      const baseSchema: JSONSchema4 =
        collectionVariants.length === 1 ? collectionVariants[0]! : { oneOf: collectionVariants }
      schema = { ...baseSchema, tsType: perCollectionTsTypes.join(' | ') }
    }

    return schema
  }
