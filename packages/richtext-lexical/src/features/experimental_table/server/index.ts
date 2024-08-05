import type { Config, Field } from 'payload'

import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { sanitizeFields } from 'payload'

import { createServerFeature } from '../../../utilities/createServerFeature.js'

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
  feature: async ({ config, isRoot }) => {
    const validRelationships = config.collections.map((c) => c.slug) || []

    const sanitizedFields = await sanitizeFields({
      config: config as unknown as Config,
      fields,
      requireFieldLevelRichTextEditor: isRoot,
      validRelationships,
    })
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#TableFeatureClient',
      generateSchemaMap: () => {
        const schemaMap = new Map<string, Field[]>()

        schemaMap.set('fields', sanitizedFields)

        return schemaMap
      },
      nodes: [
        {
          node: TableNode,
        },
        {
          node: TableCellNode,
        },
        {
          node: TableRowNode,
        },
      ],
    }
  },
  key: 'experimental_table',
})
