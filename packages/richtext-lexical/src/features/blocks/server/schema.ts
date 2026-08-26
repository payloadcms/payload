import type { JSONSchema4 } from 'json-schema'
import type { Block, JsonObject } from 'payload'

import { fieldsToJSONSchema, flattenAllFields, registerBlockInterface } from 'payload'

import type { LexicalElementFormat } from '../../../types/nodeTypes.js'
import type { JSONSchemaArgs, JSONSchemaFn } from '../../typesServer.js'

import { formatSchema } from '../../../types/jsonSchemaHelpers.js'

type BaseBlockFields<TFields extends JsonObject = JsonObject> = {
  blockName?: null | string
  blockType: string
} & TFields

export type BlockFields<TFields extends JsonObject = JsonObject> = {
  id: string
} & BaseBlockFields<TFields>

export type BlockFieldsOptionalID<TFields extends JsonObject = JsonObject> = {
  id?: string
} & BaseBlockFields<TFields>

export type InlineBlockFields<TFields extends JsonObject = JsonObject> = {
  blockType: string
  id: string
} & TFields

// Distributive (`TFields extends unknown ?`) so `SerializedBlockNode<A | B>` expands to
// `SerializedBlockNode<A> | SerializedBlockNode<B>` - i.e. a discriminated union where each block
// keeps its own fields. Without this, `Omit<A | B, ...>` collapses to the blocks' common keys and
// every block-specific field is lost. Lets users write either form interchangeably.
export type SerializedBlockNode<TFields extends { blockType: string } = { blockType: string }> =
  TFields extends unknown
    ? {
        fields: { blockName?: null | string; id: string } & Omit<TFields, 'blockName' | 'id'>
        format: LexicalElementFormat
        type: 'block'
        version: number
      }
    : never

export type SerializedInlineBlockNode<
  TFields extends { blockType: string } = { blockType: string },
> = TFields extends unknown
  ? {
      fields: { id: string } & Omit<TFields, 'id'>
      type: 'inlineBlock'
      version: number
    }
  : never

/**
 * MUST stay byte-for-byte in sync with the runtime `SerializedBlockNode` and
 * `SerializedInlineBlockNode` declared above.
 */
const BLOCK_NODES_TS = `export type SerializedBlockNode<TFields extends { blockType: string }> = TFields extends unknown ? {
  type: 'block';
  format: LexicalElementFormat;
  version: number;
  fields: { id: string; blockName?: string | null } & Omit<TFields, 'id' | 'blockName'>;
} : never;
export type SerializedInlineBlockNode<TFields extends { blockType: string }> = TFields extends unknown ? {
  type: 'inlineBlock';
  version: number;
  fields: { id: string } & Omit<TFields, 'id'>;
} : never;`

/**
 * JSON Schema for one block's `fields:` payload. Strips Payload's auto-added
 * `id`/`blockName` and re-adds them with strict runtime types: required
 * non-null `id`, optional `blockName?: string | null` (omitted for inline
 * blocks). Registers the interface through `registerBlockInterface` (shared with
 * payload core) and returns its collision-safe name.
 */
const buildBlockFieldsSchema = (
  block: Block,
  args: JSONSchemaArgs,
  { isInlineBlock }: { isInlineBlock: boolean },
): string => {
  const flattened = flattenAllFields({ fields: block.fields })
  const userFieldsSchema = args.config
    ? fieldsToJSONSchema({
        collectionIDFieldTypes: args.collectionIDFieldTypes,
        config: args.config,
        fields: flattened,
        i18n: args.i18n,
        interfaceNameDefinitions: args.interfaceNameDefinitions,
        typeStringDefinitions: args.typeStringDefinitions,
        variant: args.variant,
      })
    : { properties: {}, required: [] }

  const {
    id: _stripId,
    blockName: _stripBlockName,
    ...userOnlyProperties
  } = userFieldsSchema.properties ?? {}
  const userOnlyRequired = (userFieldsSchema.required ?? []).filter(
    (r) => r !== 'id' && r !== 'blockName',
  )

  const properties: { [k: string]: JSONSchema4 } = {
    id: { type: 'string' },
    blockType: { type: 'string', const: block.slug },
    ...userOnlyProperties,
  }
  const required = ['id', 'blockType', ...userOnlyRequired]

  if (!isInlineBlock) {
    properties.blockName = { type: ['string', 'null'] }
  }

  const fieldsSchema: JSONSchema4 = {
    type: 'object',
    additionalProperties: false,
    properties,
    required,
  }

  return registerBlockInterface(block, fieldsSchema, args.interfaceNameDefinitions, args.variant)
}

export const createBlockNodeJSONSchema =
  (blockConfigs: Block[]): JSONSchemaFn =>
  (args) => {
    args.typeStringDefinitions.add(BLOCK_NODES_TS)
    const definitionNames = blockConfigs.map((block) =>
      buildBlockFieldsSchema(block, args, { isInlineBlock: false }),
    )

    const fieldsSchema: JSONSchema4 =
      definitionNames.length === 0
        ? { type: 'object', additionalProperties: true }
        : definitionNames.length === 1
          ? { $ref: `#/$defs/${definitionNames[0]!}` }
          : { oneOf: definitionNames.map((name) => ({ $ref: `#/$defs/${name}` })) }

    const tsType =
      definitionNames.length > 0
        ? `SerializedBlockNode<${definitionNames.join(' | ')}>`
        : `SerializedBlockNode<{ blockType: string }>`

    return {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', const: 'block' },
        fields: fieldsSchema,
        format: formatSchema,
        version: { type: 'integer' },
      },
      required: ['fields', 'format', 'type', 'version'],
      tsType,
    }
  }

export const createInlineBlockNodeJSONSchema =
  (inlineBlockConfigs: Block[]): JSONSchemaFn =>
  (args) => {
    args.typeStringDefinitions.add(BLOCK_NODES_TS)
    const definitionNames = inlineBlockConfigs.map((block) =>
      buildBlockFieldsSchema(block, args, { isInlineBlock: true }),
    )

    const fieldsSchema: JSONSchema4 =
      definitionNames.length === 0
        ? { type: 'object', additionalProperties: true }
        : definitionNames.length === 1
          ? { $ref: `#/$defs/${definitionNames[0]!}` }
          : { oneOf: definitionNames.map((name) => ({ $ref: `#/$defs/${name}` })) }

    const tsType =
      definitionNames.length > 0
        ? `SerializedInlineBlockNode<${definitionNames.join(' | ')}>`
        : `SerializedInlineBlockNode<{ blockType: string }>`

    return {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', const: 'inlineBlock' },
        fields: fieldsSchema,
        version: { type: 'integer' },
      },
      required: ['fields', 'type', 'version'],
      tsType,
    }
  }
