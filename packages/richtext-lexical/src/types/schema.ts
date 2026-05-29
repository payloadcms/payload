import type { JSONSchema4 } from 'json-schema'

import { withNullableJSONSchemaType } from 'payload'

import type { SanitizedServerEditorConfig } from '../lexical/config/types.js'
import type { LexicalRichTextAdapter } from './index.js'

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
  }) => {
    let jsonSchema: JSONSchema4 = {
      // This schema matches the SerializedEditorState type so far, that it's possible to cast SerializedEditorState to this schema without any errors.
      // In the future, we should
      // 1) allow recursive children
      // 2) Pass in all the different types for every node added to the editorconfig. This can be done with refs in the schema.
      type: withNullableJSONSchemaType('object', isRequired),
      properties: {
        root: {
          type: 'object',
          additionalProperties: false,
          properties: {
            type: {
              type: 'string',
            },
            children: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  type: {
                    type: 'string',
                    tsType: 'any',
                  },
                  version: {
                    type: 'integer',
                  },
                },
                required: ['type', 'version'],
              },
            },
            direction: {
              oneOf: [
                {
                  enum: ['ltr', 'rtl'],
                },
                {
                  type: 'null',
                },
              ],
            },
            format: {
              type: 'string',
              enum: ['left', 'start', 'center', 'right', 'end', 'justify', ''], // ElementFormatType, since the root node is an element
            },
            indent: {
              type: 'integer',
            },
            version: {
              type: 'integer',
            },
          },
          required: ['children', 'direction', 'format', 'indent', 'type', 'version'],
        },
      },
      required: ['root'],
    }
    for (const modifyJSONSchema of editorConfig.features.generatedTypes.modifyJSONSchemas) {
      jsonSchema = modifyJSONSchema({
        collectionIDFieldTypes,
        config,
        currentSchema: jsonSchema,
        field,
        i18n,
        interfaceNameDefinitions,
        isRequired,
      })
    }

    return jsonSchema
  }
}
