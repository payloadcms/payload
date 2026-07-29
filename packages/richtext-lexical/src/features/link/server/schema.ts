import type { JSONSchema4 } from 'json-schema'
import type { SerializedLexicalNode } from 'lexical'
import type { DefaultDocumentIDType, Field } from 'payload'

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
      linkType: { type: 'string', enum: ['custom', 'internal'] },
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
  const hasUserExtras = sanitizedFieldsWithoutText.some(
    (field) => 'name' in field && !STANDARD_LINK_FIELD_NAMES.has(field.name),
  )
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
