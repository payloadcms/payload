import type { JSONSchema4 } from 'json-schema'
import type { SerializedElementNode, SerializedLexicalNode } from 'lexical'
import type { DefaultDocumentIDType, Field, JsonValue } from 'payload'

import { fieldsToJSONSchema, flattenAllFields } from 'payload'

import type { StronglyTypedElementNode } from '../../../types/nodeTypes.js'
import type { JSONSchemaArgs, JSONSchemaFn } from '../../typesServer.js'

export type LinkFields = {
  [key: string]: JsonValue
  doc?: {
    relationTo: string
    value:
      | {
          // Actual doc data, populated in afterRead hook
          [key: string]: JsonValue
          id: DefaultDocumentIDType
        }
      | DefaultDocumentIDType
  } | null
  linkType: 'custom' | 'internal'
  newTab: boolean
  url?: string
}

export type SerializedLinkNode<TChildren extends SerializedLexicalNode = SerializedLexicalNode> = {
  fields: LinkFields
  /** @todo make required in 4.0 and type AutoLinkNode differently */
  id?: string
} & StronglyTypedElementNode<SerializedElementNode, 'link', TChildren>

export type SerializedAutoLinkNode<
  TChildren extends SerializedLexicalNode = SerializedLexicalNode,
> = {
  fields: LinkFields
} & StronglyTypedElementNode<SerializedElementNode, 'autolink', TChildren>

const LINK_NODES_TS = `export interface LexicalLinkFields {
  doc?: { relationTo: string; value: string | number } | null;
  linkType: 'custom' | 'internal';
  newTab: boolean;
  url?: string;
  [k: string]: unknown;
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
              value: { oneOf: [{ type: 'string' }, { type: 'number' }] },
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
    required: ['linkType', 'newTab', ...userFieldsSchema.required],
  }
}

export const createLinkNodeJSONSchema =
  (sanitizedFieldsWithoutText: Field[]): JSONSchemaFn =>
  (args) => {
    const { elementNodeSchema, nodeUnionName, typeStringDefinitions } = args
    typeStringDefinitions.add(LINK_NODES_TS)
    return elementNodeSchema({
      nodeType: 'link',
      properties: {
        id: { type: 'string' },
        fields: buildLinkFieldsJSONSchema(sanitizedFieldsWithoutText, args),
      },
      required: ['fields'],
      tsType: `SerializedLinkNode<${nodeUnionName}>`,
    })
  }

export const createAutoLinkNodeJSONSchema =
  (sanitizedFieldsWithoutText: Field[]): JSONSchemaFn =>
  (args) => {
    const { elementNodeSchema, nodeUnionName, typeStringDefinitions } = args
    typeStringDefinitions.add(LINK_NODES_TS)
    return elementNodeSchema({
      nodeType: 'autolink',
      properties: {
        fields: buildLinkFieldsJSONSchema(sanitizedFieldsWithoutText, args),
      },
      required: ['fields'],
      tsType: `SerializedAutoLinkNode<${nodeUnionName}>`,
    })
  }
