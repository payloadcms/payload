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
 * A placeholder string that will be replaced with the real union name later.
 * Union = a union of all possible node types for this richtext field.
 *
 * We need to replace this *later*, because we're using a hadsh of the schema (like `LexicalNodes_AB12CD34`).
 * We cannot calculate the hash until we've built the whole schema, but we can't build the whole schema
 * until we have the hash as a name for the union - chicken-and-egg problem.
 *
 * We need to hash the actual schema to benefit from deduplication of two identical lexical fields.
 */
const NODE_UNION_NAME_PLACEHOLDER = '__LEXICAL_NODE_UNION_NAME__'

export const getFieldToJSONSchema: (args: {
  editorConfig: SanitizedServerEditorConfig
}) => LexicalRichTextAdapter['jsonSchema'] = ({ editorConfig }) => {
  return ({
    collectionIDFieldTypes,
    config,
    field,
    i18n,
    interfaceNameDefinitions,
    isRequired,
    typeStringDefinitions,
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
            $ref: `#/definitions/${NODE_UNION_NAME_PLACEHOLDER}`,
          },
        }),
      field,
      i18n,
      interfaceNameDefinitions,
      nodeUnionName: NODE_UNION_NAME_PLACEHOLDER,
      typeStringDefinitions,
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

    const hash = createHash('sha256').update(nodeUnionJson).digest('hex').slice(0, 8).toUpperCase()
    const nodeUnionName = `LexicalNodes_${hash}`

    const replacePlaceholder = (schemaString: string) =>
      JSON.parse(schemaString.replaceAll(NODE_UNION_NAME_PLACEHOLDER, nodeUnionName)) as JSONSchema4

    interfaceNameDefinitions.set(nodeUnionName, replacePlaceholder(nodeUnionJson))

    let jsonSchema = replacePlaceholder(JSON.stringify(rootSchemaWithPlaceholder))

    for (const modifyJSONSchema of editorConfig.features.generatedTypes.modifyJSONSchemas) {
      jsonSchema = modifyJSONSchema({
        collectionIDFieldTypes,
        config,
        currentSchema: jsonSchema,
        field,
        i18n,
        interfaceNameDefinitions,
        isRequired,
        typeStringDefinitions,
      })
    }

    return jsonSchema
  }
}
