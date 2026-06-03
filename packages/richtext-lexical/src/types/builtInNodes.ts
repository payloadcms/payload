import type { JSONSchema4 } from 'json-schema'

import { withNullableJSONSchemaType } from 'payload'

import type { JSONSchemaFn } from '../features/typesServer.js'

import { versionSchema } from './jsonSchemaHelpers.js'

/**
 * Cross-cutting Lexical types shared by every element node. Inlined into
 * `payload-types.ts`. Must stay byte-for-byte in sync with the runtime twins
 * in `types/nodeTypes.ts` (`LexicalElementFormat`, `LexicalElementDirection`,
 * `SerializedLexicalElementBase`) — cross-module assignability depends on it.
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

/** MUST stay byte-for-byte in sync with `LexicalTextMode` in `types/nodeTypes.ts`. */
const LEXICAL_TEXT_MODE_TS = `export type LexicalTextMode = 'normal' | 'token' | 'segmented';`

/** MUST stay byte-for-byte in sync with `SerializedTextNode` in `types/nodeTypes.ts`. */
const SERIALIZED_TEXT_NODE_TS = `export interface SerializedTextNode {
  type: 'text';
  detail: number;
  format: number;
  mode: LexicalTextMode;
  style: string;
  text: string;
  version: number;
}`

/** MUST stay byte-for-byte in sync with `SerializedTabNode` in `types/nodeTypes.ts`. */
const SERIALIZED_TAB_NODE_TS = `export interface SerializedTabNode {
  type: 'tab';
  detail: number;
  format: number;
  mode: LexicalTextMode;
  style: string;
  text: string;
  version: number;
}`

/** MUST stay byte-for-byte in sync with `SerializedLineBreakNode` in `types/nodeTypes.ts`. */
const SERIALIZED_LINE_BREAK_NODE_TS = `export interface SerializedLineBreakNode {
  type: 'linebreak';
  version: number;
}`

/** MUST stay byte-for-byte in sync with `SerializedParagraphNode` in `types/nodeTypes.ts`. */
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

/** Text-node `format` bitmask (Lexical text-format flags). */
const textFormatSchema: JSONSchema4 = {
  type: 'integer',
  description:
    'Active text formats as a bitmask, OR-ed together (0 = none): bold=1, italic=2, strikethrough=4, underline=8, code=16, subscript=32, superscript=64, highlight=128, lowercase=256, uppercase=512. e.g. bold + italic = 3.',
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
      format: textFormatSchema,
      mode: textModeSchema,
      style: { type: 'string' },
      text: { type: 'string' },
      version: versionSchema,
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
      format: textFormatSchema,
      mode: textModeSchema,
      style: { type: 'string' },
      text: { type: 'string' },
      version: versionSchema,
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
      version: versionSchema,
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

/** MUST stay byte-for-byte in sync with `LexicalRichText` in `types/nodeTypes.ts`. */
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
