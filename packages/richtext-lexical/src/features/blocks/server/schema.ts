import type { JSONSchema4 } from 'json-schema'
import type { Block, JsonObject } from 'payload'

import { fieldsToJSONSchema, flattenAllFields, toWords } from 'payload'

import type { LexicalElementFormat } from '../../../types/nodeTypes.js'
import type { JSONSchemaArgs, JSONSchemaFn } from '../../typesServer.js'

import { formatSchema } from '../../../types/jsonSchemaHelpers.js'

type BaseBlockFields<TFields extends JsonObject = JsonObject> = {
  blockName: string
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

export type SerializedBlockNode<TFields extends { blockType: string } = { blockType: string }> = {
  fields: { blockName: null | string; id: string } & Omit<TFields, 'blockName' | 'id'>
  format: LexicalElementFormat
  type: 'block'
  version: number
}

export type SerializedInlineBlockNode<
  TFields extends { blockType: string } = { blockType: string },
> = {
  fields: { id: string } & Omit<TFields, 'id'>
  type: 'inlineBlock'
  version: number
}

/**
 * MUST stay byte-for-byte in sync with the runtime `SerializedBlockNode` and
 * `SerializedInlineBlockNode` declared above.
 */
const BLOCK_NODES_TS = `export type SerializedBlockNode<TFields extends { blockType: string }> = {
  type: 'block';
  format: LexicalElementFormat;
  version: number;
  fields: { id: string; blockName: string | null } & Omit<TFields, 'id' | 'blockName'>;
};
export type SerializedInlineBlockNode<TFields extends { blockType: string }> = {
  type: 'inlineBlock';
  version: number;
  fields: { id: string } & Omit<TFields, 'id'>;
};`

/** Block `interfaceName` if set, otherwise a PascalCase form of the slug. */
const blockFieldsInterfaceName = (block: Block) => block.interfaceName ?? toWords(block.slug, true)

/**
 * JSON Schema for one block's `fields:` payload. Strips Payload's auto-added
 * `id`/`blockName` and re-adds them with strict runtime types: required
 * non-null `id`, required `blockName: string | null` (omitted for inline
 * blocks). Always registers as a top-level `$ref`.
 */
const buildBlockFieldsSchema = (
  block: Block,
  args: JSONSchemaArgs,
  { isInlineBlock }: { isInlineBlock: boolean },
): JSONSchema4 => {
  const flattened = flattenAllFields({ fields: block.fields })
  const userFieldsSchema = args.config
    ? fieldsToJSONSchema({
        collectionIDFieldTypes: args.collectionIDFieldTypes,
        config: args.config,
        fields: flattened,
        i18n: args.i18n,
        interfaceNameDefinitions: args.interfaceNameDefinitions,
        typeStringDefinitions: args.typeStringDefinitions,
      })
    : { properties: {}, required: [] }

  const {
    id: _stripId,
    blockName: _stripBlockName,
    ...userOnlyProperties
  } = (userFieldsSchema.properties ?? {}) as { [k: string]: JSONSchema4 }
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
    required.push('blockName')
  }

  const fieldsSchema: JSONSchema4 = {
    type: 'object',
    additionalProperties: false,
    properties,
    required,
  }

  const definitionName = blockFieldsInterfaceName(block)
  args.interfaceNameDefinitions.set(definitionName, fieldsSchema)
  return { $ref: `#/definitions/${definitionName}` }
}

export const createBlockNodeJSONSchema =
  (blockConfigs: Block[]): JSONSchemaFn =>
  (args) => {
    args.typeStringDefinitions.add(BLOCK_NODES_TS)
    const blockFieldsSchemas = blockConfigs.map((block) =>
      buildBlockFieldsSchema(block, args, { isInlineBlock: false }),
    )

    const fieldsSchema: JSONSchema4 =
      blockFieldsSchemas.length === 0
        ? { type: 'object', additionalProperties: true }
        : blockFieldsSchemas.length === 1
          ? blockFieldsSchemas[0]!
          : { oneOf: blockFieldsSchemas }

    const tsType =
      blockConfigs.length > 0
        ? `SerializedBlockNode<${blockConfigs.map((b) => blockFieldsInterfaceName(b)).join(' | ')}>`
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
    const blockFieldsSchemas = inlineBlockConfigs.map((block) =>
      buildBlockFieldsSchema(block, args, { isInlineBlock: true }),
    )

    const fieldsSchema: JSONSchema4 =
      blockFieldsSchemas.length === 0
        ? { type: 'object', additionalProperties: true }
        : blockFieldsSchemas.length === 1
          ? blockFieldsSchemas[0]!
          : { oneOf: blockFieldsSchemas }

    const tsType =
      inlineBlockConfigs.length > 0
        ? `SerializedInlineBlockNode<${inlineBlockConfigs.map((b) => blockFieldsInterfaceName(b)).join(' | ')}>`
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
