import type { JSONSchema4 } from 'json-schema'

import { withNullableJSONSchemaType } from 'payload'

import type { JSONSchemaFn } from '../features/typesServer.js'

/**
 * Cross-cutting Lexical types shared by every element node. Inlined into
 * `payload-types.ts`. Per-node helpers (text, tab, linebreak, paragraph,
 * the field wrapper, and feature-supplied nodes) live with their respective
 * schemas and are added to `typeStringDefinitions` on demand.
 */
export const CORE_LEXICAL_TYPE_STRING = `/** @internal Core Lexical types — see @payloadcms/richtext-lexical. */
export type LexicalElementFormat = 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
export type LexicalElementDirection = ('ltr' | 'rtl') | null;

export interface SerializedLexicalElementBase<TChildren> {
  children: TChildren[];
  direction: LexicalElementDirection;
  format: LexicalElementFormat;
  indent: number;
  textFormat?: number;
  textStyle?: string;
  version: number;
}`

/**
 * Built-in Lexical node schemas (always present regardless of feature config).
 * Co-located with the TS source they reference — each `JSONSchemaFn` adds
 * its helper interface(s) to `typeStringDefinitions` and returns the JSON
 * schema for that node.
 */

const LEXICAL_TEXT_MODE_TS = `export type LexicalTextMode = 'normal' | 'token' | 'segmented';`

const SERIALIZED_TEXT_NODE_TS = `export interface SerializedTextNode {
  type: 'text';
  detail: number;
  format: number;
  mode: LexicalTextMode;
  style: string;
  text: string;
  version: number;
}`

const SERIALIZED_TAB_NODE_TS = `export interface SerializedTabNode {
  type: 'tab';
  detail: number;
  format: number;
  mode: LexicalTextMode;
  style: string;
  text: string;
  version: number;
}`

const SERIALIZED_LINE_BREAK_NODE_TS = `export interface SerializedLineBreakNode {
  type: 'linebreak';
  version: number;
}`

const SERIALIZED_PARAGRAPH_NODE_TS = `export interface SerializedParagraphNode<TChildren> extends SerializedLexicalElementBase<TChildren> {
  type: 'paragraph';
  textFormat: number;
  textStyle: string;
}`

const textModeSchema: JSONSchema4 = {
  type: 'string',
  enum: ['normal', 'token', 'segmented'],
  tsType: 'LexicalTextMode',
}

export const textNodeJSONSchema: JSONSchemaFn = ({ typeStringDefinitions }) => {
  typeStringDefinitions.add(LEXICAL_TEXT_MODE_TS)
  typeStringDefinitions.add(SERIALIZED_TEXT_NODE_TS)
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: { type: 'string', const: 'text' },
      detail: { type: 'integer' },
      format: { type: 'integer' },
      mode: textModeSchema,
      style: { type: 'string' },
      text: { type: 'string' },
      version: { type: 'integer' },
    },
    required: ['detail', 'format', 'mode', 'style', 'text', 'type', 'version'],
    tsType: 'SerializedTextNode',
  }
}

export const tabNodeJSONSchema: JSONSchemaFn = ({ typeStringDefinitions }) => {
  typeStringDefinitions.add(LEXICAL_TEXT_MODE_TS)
  typeStringDefinitions.add(SERIALIZED_TAB_NODE_TS)
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: { type: 'string', const: 'tab' },
      detail: { type: 'integer' },
      format: { type: 'integer' },
      mode: textModeSchema,
      style: { type: 'string' },
      text: { type: 'string' },
      version: { type: 'integer' },
    },
    required: ['detail', 'format', 'mode', 'style', 'text', 'type', 'version'],
    tsType: 'SerializedTabNode',
  }
}

export const lineBreakNodeJSONSchema: JSONSchemaFn = ({ typeStringDefinitions }) => {
  typeStringDefinitions.add(SERIALIZED_LINE_BREAK_NODE_TS)
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: { type: 'string', const: 'linebreak' },
      version: { type: 'integer' },
    },
    required: ['type', 'version'],
    tsType: 'SerializedLineBreakNode',
  }
}

export const paragraphNodeJSONSchema: JSONSchemaFn = ({
  elementNodeSchema,
  nodeUnionName,
  typeStringDefinitions,
}) => {
  typeStringDefinitions.add(SERIALIZED_PARAGRAPH_NODE_TS)
  return elementNodeSchema({
    nodeType: 'paragraph',
    properties: {
      textFormat: { type: 'integer' },
      textStyle: { type: 'string' },
    },
    required: ['textFormat', 'textStyle'],
    tsType: `SerializedParagraphNode<${nodeUnionName}>`,
  })
}

const ROOT_NODE_TS = `/** Shape of a Lexical \`richText\` field. */
export interface LexicalRichText<TNode> {
  root: {
    children: TNode[];
    direction: LexicalElementDirection;
    format: LexicalElementFormat;
    indent: number;
    type: 'root';
    version: number;
  };
}`

export const rootNodeJSONSchema: JSONSchemaFn = ({
  elementNodeSchema,
  field,
  nodeUnionName,
  typeStringDefinitions,
}) => {
  typeStringDefinitions.add(ROOT_NODE_TS)
  return {
    type: withNullableJSONSchemaType('object', !!field.required),
    additionalProperties: false,
    properties: {
      root: elementNodeSchema({
        nodeType: 'root',
      }),
    },
    required: ['root'],
    tsType: field.required
      ? `LexicalRichText<${nodeUnionName}>`
      : `LexicalRichText<${nodeUnionName}> | null`,
  }
}
