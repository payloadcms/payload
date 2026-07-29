import type { Config, Field, FieldSchemaMap } from 'payload'

import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { sanitizeFields } from 'payload'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { PAYLOAD_TABLE } from '../markdownTransformer.js'
import { tableCellNodeJSONSchema, tableNodeJSONSchema, tableRowNodeJSONSchema } from './schema.js'

export type {
  SerializedTableCellNode,
  SerializedTableNode,
  SerializedTableRowNode,
} from './schema.js'

const fields: Field[] = [
  {
    name: 'rows',
    type: 'number',
    defaultValue: 5,
    required: true,
  },
  {
    name: 'columns',
    type: 'number',
    defaultValue: 5,
    required: true,
  },
]

export const EXPERIMENTAL_TableFeature = createServerFeature({
  feature: async ({ config, isRoot, parentIsLocalized }) => {
    const validRelationships = config.collections.map((c) => c.slug) || []

    const sanitizedFields = await sanitizeFields({
      config: config as unknown as Config,
      fields,
      parentIsLocalized,
      requireFieldLevelRichTextEditor: isRoot,
      validRelationships,
    })
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#TableFeatureClient',
      generateSchemaMap: () => {
        const schemaMap: FieldSchemaMap = new Map()

        schemaMap.set('fields', {
          fields: sanitizedFields,
        })

        return schemaMap
      },
      markdownTransformers: [PAYLOAD_TABLE],
      nodes: [
        createNode({
          jsonSchema: tableNodeJSONSchema,
          node: TableNode,
        }),
        createNode({
          jsonSchema: tableCellNodeJSONSchema,
          node: TableCellNode,
        }),
        createNode({
          jsonSchema: tableRowNodeJSONSchema,
          node: TableRowNode,
        }),
      ],
    }
  },
  key: 'experimental_table',
})
