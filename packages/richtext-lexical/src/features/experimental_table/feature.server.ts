import type { Config, Field } from 'payload'

import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { sanitizeFields } from 'payload'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { TableFeatureClient } from '../../exports/client/index.js'
import { createServerFeature } from '../../utilities/createServerFeature.js'
import { convertLexicalNodesToHTML } from '../converters/html/converter/index.js'
import { createNode } from '../typeUtilities.js'

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
      ClientFeature: TableFeatureClient,
      generateSchemaMap: () => {
        const schemaMap = new Map<string, Field[]>()

        schemaMap.set('fields', sanitizedFields)

        return schemaMap
      },
      nodes: [
        createNode({
          converters: {
            html: {
              converter: async ({
                converters,
                draft,
                node,
                overrideAccess,
                parent,
                req,
                showHiddenFields,
              }) => {
                const childrenText = await convertLexicalNodesToHTML({
                  converters,
                  draft,
                  lexicalNodes: node.children,
                  overrideAccess,
                  parent: {
                    ...node,
                    parent,
                  },
                  req,
                  showHiddenFields,
                })
                return `<table class="lexical-table" style="border-collapse: collapse;">${childrenText}</table>`
              },
              nodeTypes: [TableNode.getType()],
            },
          },
          node: TableNode,
        }),
        createNode({
          converters: {
            html: {
              converter: async ({
                converters,
                draft,
                node,
                overrideAccess,
                parent,
                req,
                showHiddenFields,
              }) => {
                const childrenText = await convertLexicalNodesToHTML({
                  converters,
                  draft,
                  lexicalNodes: node.children,
                  overrideAccess,
                  parent: {
                    ...node,
                    parent,
                  },
                  req,
                  showHiddenFields,
                })

                const tagName = node.headerState > 0 ? 'th' : 'td'
                const headerStateClass = `lexical-table-cell-header-${node.headerState}`
                const backgroundColor = node.backgroundColor
                  ? `background-color: ${node.backgroundColor};`
                  : ''
                const colSpan = node.colSpan > 1 ? `colspan="${node.colSpan}"` : ''
                const rowSpan = node.rowSpan > 1 ? `rowspan="${node.rowSpan}"` : ''

                return `<${tagName} class="lexical-table-cell ${headerStateClass}" style="border: 1px solid #ccc; padding: 8px; ${backgroundColor}" ${colSpan} ${rowSpan}>${childrenText}</${tagName}>`
              },
              nodeTypes: [TableCellNode.getType()],
            },
          },
          node: TableCellNode,
        }),
        createNode({
          converters: {
            html: {
              converter: async ({
                converters,
                draft,
                node,
                overrideAccess,
                parent,
                req,
                showHiddenFields,
              }) => {
                const childrenText = await convertLexicalNodesToHTML({
                  converters,
                  draft,
                  lexicalNodes: node.children,
                  overrideAccess,
                  parent: {
                    ...node,
                    parent,
                  },
                  req,
                  showHiddenFields,
                })
                return `<tr class="lexical-table-row">${childrenText}</tr>`
              },
              nodeTypes: [TableRowNode.getType()],
            },
          },
          node: TableRowNode,
        }),
      ],
    }
  },
  key: 'experimental_table',
})
