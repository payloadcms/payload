import type { Field } from 'payload'

import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { TableFeatureClient } from '../../exports/client/index.js'
import { createServerFeature } from '../../utilities/createServerFeature.js'

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
  feature: {
    ClientFeature: TableFeatureClient,
    generateSchemaMap: () => {
      const schemaMap = new Map<string, Field[]>()

      schemaMap.set('fields', fields)

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
  },
  key: 'experimental_table',
})
