import type { JSONSchema4 } from 'json-schema'

import { createHash } from 'crypto'

import type { JSONSchemaArgs } from '../features/typesServer.js'
import type { SanitizedServerEditorConfig } from '../lexical/config/types.js'
import type { LexicalRichTextAdapter } from './index.js'

import {
  CORE_LEXICAL_TYPE_STRING,
  lineBreakNodeJSONSchema,
  paragraphNodeJSONSchema,
  rootNodeJSONSchema,
  tabNodeJSONSchema,
  textNodeJSONSchema,
} from './builtInNodes.js'
import { elementNodeSchema } from './jsonSchemaHelpers.js'

/**
 * The node-union name is a hash of its own schema (so identical editors dedupe).
 * Since the schema references the union name, we use a placeholder during build
 * and substitute the real hash once everything's assembled. Features can derive
 * sibling names (e.g. `LexicalLinkFields_<hash>`) using the bare hash placeholder.
 */
const NODE_UNION_HASH_PLACEHOLDER = '__LEXICAL_NODE_UNION_HASH__'
const NODE_UNION_NAME_PLACEHOLDER = `LexicalNodes_${NODE_UNION_HASH_PLACEHOLDER}`

export const getFieldToJSONSchema: (args: {
  editorConfig: SanitizedServerEditorConfig
}) => LexicalRichTextAdapter['jsonSchema'] = ({ editorConfig }) => {
  return ({
    collectionIDFieldTypes,
    config,
    field,
    i18n,
    interfaceNameDefinitions,
    typeStringDefinitions,
    variant = 'output',
  }) => {
    // Step 1: build the schema for every node type allowed in this field.

    typeStringDefinitions.add(CORE_LEXICAL_TYPE_STRING)

    const nodeJsonSchemaArgs: JSONSchemaArgs = {
      collectionIDFieldTypes,
      config,
      // Each element node needs its children typed using the union node type recursively
      elementNodeSchema: (args) =>
        elementNodeSchema({
          ...args,
          nodeUnionRef: {
            $ref: `#/$defs/${NODE_UNION_NAME_PLACEHOLDER}`,
          },
        }),
      field,
      i18n,
      interfaceNameDefinitions,
      nodeUnionName: NODE_UNION_NAME_PLACEHOLDER,
      typeStringDefinitions,
      variant,
    }

    const nodeSchemas: JSONSchema4[] = [
      // Add built-in node schemas
      textNodeJSONSchema(nodeJsonSchemaArgs),
      tabNodeJSONSchema(nodeJsonSchemaArgs),
      lineBreakNodeJSONSchema(nodeJsonSchemaArgs),
      paragraphNodeJSONSchema(nodeJsonSchemaArgs),
      // Add feature node schemas
      ...editorConfig.features.nodes
        .filter((node) => node.jsonSchema)
        .map((node) => node.jsonSchema!(nodeJsonSchemaArgs)),
    ]
    const rootSchemaWithPlaceholder = rootNodeJSONSchema(nodeJsonSchemaArgs)

    // Step 2: get the final node union name, then replace the placeholder
    // in both the union members and the root node.
    //
    // See JSDocs for `NODE_UNION_NAME_PLACEHOLDER` for why we use a placeholder and hashing.
    const nodeUnionJson = JSON.stringify({ oneOf: nodeSchemas })

    // Features can register per-editor definitions during node-schema build (e.g. a link node's
    // custom `LexicalLinkFields_<hash>`), keyed by the not-yet-resolved hash placeholder. The node
    // union only `$ref`s them, so their content isn't in `nodeUnionJson` - two editors with the same
    // nodes but different feature config (e.g. different custom link fields) would otherwise hash
    // identically and overwrite each other's definition. To avoid that, include that content into the hash too.
    const pendingDefinitions = [...interfaceNameDefinitions.entries()]
      .filter(([key]) => key.includes(NODE_UNION_HASH_PLACEHOLDER))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

    const hashInput = pendingDefinitions.length
      ? JSON.stringify({ definitions: pendingDefinitions, oneOf: nodeSchemas })
      : nodeUnionJson

    const hash = createHash('sha256').update(hashInput).digest('hex').slice(0, 8).toUpperCase()

    // Distinguish an input node union from an output one with an `_Input` suffix - unless an
    // identical output union already exists (a relationship-free editor whose input == output), in
    // which case share it. The content hash means differing unions split and identical ones merge.
    const sharesOutputUnion =
      variant === 'input' && interfaceNameDefinitions.has(`LexicalNodes_${hash}`)
    const resolvedHash = variant === 'input' && !sharesOutputUnion ? `${hash}_Input` : hash
    const nodeUnionName = `LexicalNodes_${resolvedHash}`

    // Replacing the hash resolves the union name and any feature-derived
    // sibling names in one pass.
    const replacePlaceholder = (schemaString: string) =>
      JSON.parse(schemaString.replaceAll(NODE_UNION_HASH_PLACEHOLDER, resolvedHash)) as JSONSchema4

    // Resolve placeholders left in feature-registered definitions so Map keys
    // and `$ref` targets line up.
    for (const [oldKey, schema] of [...interfaceNameDefinitions.entries()]) {
      const newKey = oldKey.replaceAll(NODE_UNION_HASH_PLACEHOLDER, resolvedHash)
      const resolvedSchema = replacePlaceholder(JSON.stringify(schema))
      if (newKey !== oldKey) {
        interfaceNameDefinitions.delete(oldKey)
      }
      interfaceNameDefinitions.set(newKey, resolvedSchema)
    }

    interfaceNameDefinitions.set(nodeUnionName, replacePlaceholder(nodeUnionJson))

    return replacePlaceholder(JSON.stringify(rootSchemaWithPlaceholder))
  }
}
