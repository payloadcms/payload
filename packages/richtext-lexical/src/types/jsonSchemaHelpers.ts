import type { JSONSchema4 } from 'json-schema'

/** `format` property shared by every element node (Lexical `ElementFormatType`). */
export const formatSchema: JSONSchema4 = {
  type: 'string',
  description: 'How this element is aligned. Empty string means no explicit alignment.',
  enum: ['left', 'start', 'center', 'right', 'end', 'justify', ''],
  tsType: 'LexicalElementFormat',
}

/** `direction` property shared by every element node. */
export const directionSchema: JSONSchema4 = {
  oneOf: [{ type: 'string', enum: ['ltr', 'rtl'] }, { type: 'null' }],
  tsType: 'LexicalElementDirection',
}

/** `version` property shared by every Lexical node. */
export const versionSchema: JSONSchema4 = {
  type: 'integer',
  description: "Lexical's internal serialization version for this node type.",
}

type ElementNodeSchemaOptions = {
  nodeType: string
  properties?: { [k: string]: JSONSchema4 }
  required?: string[]
  /** TS helper-type expression — emitted verbatim by json-schema-to-typescript. */
  tsType?: string
}

/**
 * Builds the JSON Schema for a Lexical element node - merges the shared
 * element-base shape (children/direction/format/indent/version) with the
 * node-specific bits a feature provides.
 */
export const elementNodeSchema = ({
  nodeType,
  nodeUnionRef,
  properties = {},
  required = [],
  tsType,
}: { nodeUnionRef: JSONSchema4 } & ElementNodeSchemaOptions): JSONSchema4 => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    type: { type: 'string', const: nodeType },
    children: { type: 'array', items: nodeUnionRef },
    direction: directionSchema,
    format: formatSchema,
    indent: { type: 'integer' },
    version: versionSchema,
    ...properties,
  },
  required: ['children', 'direction', 'format', 'indent', 'type', 'version', ...required],
  ...(tsType ? { tsType } : {}),
})

/**
 * `elementNodeSchema` HOC type, so that features don't have to pass `nodeUnionRef` every time.
 */
export type ElementNodeSchemaFn = (opts: ElementNodeSchemaOptions) => JSONSchema4
