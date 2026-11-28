import type { JSONSchema4 } from 'json-schema'
import type { SerializedLexicalNode } from 'lexical'
import type { DefaultDocumentIDType, Field, FlattenedField } from 'payload'

import { createHash } from 'crypto'
import { fieldsToJSONSchema, flattenAllFields } from 'payload'

import type { SerializedLexicalElementBase } from '../../../types/nodeTypes.js'
import type { JSONSchemaArgs, JSONSchemaFn } from '../../typesServer.js'

export type LinkFields = {
  /** Custom fields added via `LinkFeature`'s `fields` prop. */
  [k: string]: unknown
  doc?: {
    relationTo: string
    /** Document ID, or the full doc when populated by the afterRead hook. */
    value: { [k: string]: unknown; id: DefaultDocumentIDType } | DefaultDocumentIDType
  } | null
  linkType: 'custom' | 'internal'
  newTab: boolean
  url?: string
}

export interface SerializedLinkNode<
  TChildren extends SerializedLexicalNode = SerializedLexicalNode,
  TFields = LinkFields,
> extends SerializedLexicalElementBase<TChildren> {
  fields: TFields
  /** @todo make required in 4.0 and type AutoLinkNode differently */
  id?: string
  type: 'link'
}

export interface SerializedAutoLinkNode<
  TChildren extends SerializedLexicalNode = SerializedLexicalNode,
  TFields = LinkFields,
> extends SerializedLexicalElementBase<TChildren> {
  fields: TFields
  type: 'autolink'
}

/**
 * MUST stay byte-for-byte in sync with the runtime `LinkFields`, `SerializedLinkNode`,
 * and `SerializedAutoLinkNode` declared above.
 */
const LINK_NODES_TS = `export interface LexicalLinkFields {
  [k: string]: unknown;
  doc?: {
    relationTo: string;
    value: Config['db']['defaultIDType'] | { [k: string]: unknown; id: Config['db']['defaultIDType'] };
  } | null;
  linkType: 'custom' | 'internal';
  newTab: boolean;
  url?: string;
}
export interface SerializedLinkNode<TChildren, TFields = LexicalLinkFields> extends SerializedLexicalElementBase<TChildren> {
  type: 'link';
  fields: TFields;
  id?: string;
}
export interface SerializedAutoLinkNode<TChildren, TFields = LexicalLinkFields> extends SerializedLexicalElementBase<TChildren> {
  type: 'autolink';
  fields: TFields;
}`

const DEFAULT_LINK_TYPE_OPTIONS = new Set(['custom', 'internal'])

/**
 * Checks whether a `linkType` field defines custom options outside the built-in
 * `'custom' | 'internal'` set.
 */
const hasCustomLinkTypeOptions = (field: Field | FlattenedField): boolean => {
  if (field.type !== 'radio' && field.type !== 'select') {
    return true
  }
  return field.options.some((opt) => {
    const value = typeof opt === 'string' ? opt : opt.value
    return !DEFAULT_LINK_TYPE_OPTIONS.has(value)
  })
}

const buildLinkFieldsJSONSchema = (
  sanitizedFieldsWithoutText: Field[],
  {
    collectionIDFieldTypes,
    config,
    i18n,
    interfaceNameDefinitions,
    typeStringDefinitions,
    variant,
  }: JSONSchemaArgs,
): JSONSchema4 => {
  const flattenedExtraFields = flattenAllFields({ fields: sanitizedFieldsWithoutText })
  const userFieldsSchema =
    flattenedExtraFields.length > 0 && config
      ? fieldsToJSONSchema({
          collectionIDFieldTypes,
          config,
          fields: flattenedExtraFields,
          i18n,
          interfaceNameDefinitions,
          typeStringDefinitions,
          variant,
        })
      : { properties: {}, required: [] }

  const linkTypeField = flattenedExtraFields.find((field) => field.name === 'linkType')
  const linkTypeSchema =
    linkTypeField &&
    hasCustomLinkTypeOptions(linkTypeField) &&
    userFieldsSchema.properties?.linkType
      ? userFieldsSchema.properties.linkType
      : ({ type: 'string', enum: ['custom', 'internal'] } satisfies JSONSchema4)

  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      ...userFieldsSchema.properties,
      doc: {
        oneOf: [
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              relationTo: { type: 'string' },
              value: {
                oneOf: [
                  { type: 'string' },
                  { type: 'number' },
                  // Populated form (afterRead inflates `value` into the doc).
                  {
                    type: 'object',
                    additionalProperties: true,
                    properties: { id: { type: ['string', 'number'] } },
                    required: ['id'],
                  },
                ],
              },
            },
            required: ['relationTo', 'value'],
          },
          { type: 'null' },
        ],
      },
      linkType: linkTypeSchema,
      newTab: { type: 'boolean' },
      url: { type: 'string' },
    },
    // `linkType`/`newTab` are already in `userFieldsSchema.required`; use Set to dedupe,
    // so `required` stays unique (draft 2020-12 enforces `uniqueItems`).
    required: [...new Set(['linkType', 'newTab', ...userFieldsSchema.required])],
  }
}

/** Fields auto-attached by `LinkFeature` (see `transformExtraFields`). */
const STANDARD_LINK_FIELD_NAMES = new Set(['doc', 'linkType', 'newTab', 'url'])

const hashLinkFields = (schema: JSONSchema4): string =>
  createHash('sha256').update(JSON.stringify(schema)).digest('hex').slice(0, 8).toUpperCase()

/**
 * With custom link fields, emit a `LexicalLinkFields_<hash>` interface (hashed by its own content)
 * so the link node picks up their real shape. Without any, reuse the default `LexicalLinkFields` for
 * cross-alias assignability.
 */
const resolveLinkFieldsRef = (
  sanitizedFieldsWithoutText: Field[],
  args: JSONSchemaArgs,
): { fieldsRef: JSONSchema4; fieldsTypeName: string } => {
  const fieldsSchema = buildLinkFieldsJSONSchema(sanitizedFieldsWithoutText, args)
  const flattenedFields = flattenAllFields({ fields: sanitizedFieldsWithoutText })
  const hasUserExtras = flattenedFields.some((field) => {
    if (!STANDARD_LINK_FIELD_NAMES.has(field.name)) {
      return true
    }
    return field.name === 'linkType' && hasCustomLinkTypeOptions(field)
  })
  if (!hasUserExtras) {
    return { fieldsRef: fieldsSchema, fieldsTypeName: 'LexicalLinkFields' }
  }
  const fieldsTypeName = `LexicalLinkFields_${hashLinkFields(fieldsSchema)}`
  args.interfaceNameDefinitions.set(fieldsTypeName, fieldsSchema)
  return { fieldsRef: { $ref: `#/$defs/${fieldsTypeName}` }, fieldsTypeName }
}

export const createLinkNodeJSONSchema =
  (sanitizedFieldsWithoutText: Field[]): JSONSchemaFn =>
  (args) => {
    const { elementNodeSchema, nodeUnionName, typeStringDefinitions } = args
    typeStringDefinitions.add(LINK_NODES_TS)
    const { fieldsRef, fieldsTypeName } = resolveLinkFieldsRef(sanitizedFieldsWithoutText, args)
    return elementNodeSchema({
      nodeType: 'link',
      properties: {
        id: { type: 'string' },
        fields: fieldsRef,
      },
      required: ['fields'],
      tsType: `SerializedLinkNode<${nodeUnionName}, ${fieldsTypeName}>`,
    })
  }

export const createAutoLinkNodeJSONSchema =
  (sanitizedFieldsWithoutText: Field[]): JSONSchemaFn =>
  (args) => {
    const { elementNodeSchema, nodeUnionName, typeStringDefinitions } = args
    typeStringDefinitions.add(LINK_NODES_TS)
    const { fieldsRef, fieldsTypeName } = resolveLinkFieldsRef(sanitizedFieldsWithoutText, args)
    return elementNodeSchema({
      nodeType: 'autolink',
      properties: {
        fields: fieldsRef,
      },
      required: ['fields'],
      tsType: `SerializedAutoLinkNode<${nodeUnionName}, ${fieldsTypeName}>`,
    })
  }
