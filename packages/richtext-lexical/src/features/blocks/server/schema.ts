import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import type { JSONSchema4 } from 'json-schema'
import type { SerializedLexicalNode } from 'lexical'
import type { Block, JsonObject } from 'payload'

import { fieldsToJSONSchema, flattenAllFields } from 'payload'

import type { StronglyTypedLeafNode } from '../../../types/nodeTypes.js'
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

export type SerializedBlockNode<TFields extends JsonObject = JsonObject> = {
  fields: BlockFields<TFields>
} & StronglyTypedLeafNode<SerializedDecoratorBlockNode, 'block'>

export type SerializedInlineBlockNode<TFields extends JsonObject = JsonObject> = {
  fields: InlineBlockFields<TFields>
} & StronglyTypedLeafNode<SerializedLexicalNode, 'inlineBlock'>

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

/**
 * Per-block `fields` schema. Strips Payload's auto-added `id`/`blockName`
 * (every block carries those as base fields) and re-adds them with strict
 * runtime types — required, non-null `id`; required `blockName: string | null`
 * (omitted for inline blocks).
 *
 * Blocks with `interfaceName` are emitted as top-level `$ref` definitions.
 */
const buildBlockVariantSchema = (
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

  const variantSchema: JSONSchema4 = {
    type: 'object',
    additionalProperties: false,
    properties,
    required,
  }

  if (block.interfaceName) {
    args.interfaceNameDefinitions.set(block.interfaceName, variantSchema)
    return { $ref: `#/definitions/${block.interfaceName}` }
  }

  return variantSchema
}

export const createBlockNodeJSONSchema =
  (blockConfigs: Block[]): JSONSchemaFn =>
  (args) => {
    args.typeStringDefinitions.add(BLOCK_NODES_TS)
    const variants = blockConfigs.map((block) =>
      buildBlockVariantSchema(block, args, { isInlineBlock: false }),
    )

    const fieldsSchema: JSONSchema4 =
      variants.length === 0
        ? { type: 'object', additionalProperties: true }
        : variants.length === 1
          ? variants[0]!
          : { oneOf: variants }

    const allHaveInterfaceName =
      blockConfigs.length > 0 && blockConfigs.every((b) => Boolean(b.interfaceName))
    const tsType = allHaveInterfaceName
      ? `SerializedBlockNode<${blockConfigs.map((b) => b.interfaceName!).join(' | ')}>`
      : undefined

    return {
      type: 'object',
      additionalProperties: false,
      ...(tsType ? { tsType } : {}),
      properties: {
        type: { type: 'string', const: 'block' },
        fields: fieldsSchema,
        format: formatSchema,
        version: { type: 'integer' },
      },
      required: ['fields', 'format', 'type', 'version'],
    }
  }

export const createInlineBlockNodeJSONSchema =
  (inlineBlockConfigs: Block[]): JSONSchemaFn =>
  (args) => {
    args.typeStringDefinitions.add(BLOCK_NODES_TS)
    const variants = inlineBlockConfigs.map((block) =>
      buildBlockVariantSchema(block, args, { isInlineBlock: true }),
    )

    const fieldsSchema: JSONSchema4 =
      variants.length === 0
        ? { type: 'object', additionalProperties: true }
        : variants.length === 1
          ? variants[0]!
          : { oneOf: variants }

    const allHaveInterfaceName =
      inlineBlockConfigs.length > 0 && inlineBlockConfigs.every((b) => Boolean(b.interfaceName))
    const tsType = allHaveInterfaceName
      ? `SerializedInlineBlockNode<${inlineBlockConfigs.map((b) => b.interfaceName!).join(' | ')}>`
      : undefined

    return {
      type: 'object',
      additionalProperties: false,
      ...(tsType ? { tsType } : {}),
      properties: {
        type: { type: 'string', const: 'inlineBlock' },
        fields: fieldsSchema,
        version: { type: 'integer' },
      },
      required: ['fields', 'type', 'version'],
    }
  }
