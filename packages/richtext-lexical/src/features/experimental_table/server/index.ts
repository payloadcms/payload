import type {
  SerializedTableCellNode as _SerializedTableCellNode,
  SerializedTableNode as _SerializedTableNode,
  SerializedTableRowNode as _SerializedTableRowNode,
} from '@lexical/table'
import type { Spread } from 'lexical'
import type { Config, Field, FieldSchemaMap } from 'payload'

import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { sanitizeFields } from 'payload'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { convertLexicalNodesToHTML } from '../../converters/lexicalToHtml_deprecated/converter/index.js'
import { createNode } from '../../typeUtilities.js'
import { TableMarkdownTransformer } from '../markdownTransformer.js'

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

export type SerializedTableCellNode = Spread<
  {
    type: 'tablecell'
  },
  _SerializedTableCellNode
>

export type SerializedTableNode = Spread<
  {
    type: 'table'
  },
  _SerializedTableNode
>

export type SerializedTableRowNode = Spread<
  {
    type: 'tablerow'
  },
  _SerializedTableRowNode
>
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
      markdownTransformers: [TableMarkdownTransformer],
      nodes: [
        createNode({
          converters: {
            html: {
              converter: async ({
                converters,
                currentDepth,
                depth,
                draft,
                node,
                overrideAccess,
                parent,
                req,
                showHiddenFields,
              }) => {
                const childrenText = await convertLexicalNodesToHTML({
                  converters,
                  currentDepth,
                  depth,
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
                return `<div class="lexical-table-container"><table class="lexical-table" style="border-collapse: collapse;">${childrenText}</table></div>`
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
                currentDepth,
                depth,
                draft,
                node,
                overrideAccess,
                parent,
                req,
                showHiddenFields,
              }) => {
                const childrenText = await convertLexicalNodesToHTML({
                  converters,
                  currentDepth,
                  depth,
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
                const colSpan = node.colSpan && node.colSpan > 1 ? `colspan="${node.colSpan}"` : ''
                const rowSpan = node.rowSpan && node.rowSpan > 1 ? `rowspan="${node.rowSpan}"` : ''

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
                currentDepth,
                depth,
                draft,
                node,
                overrideAccess,
                parent,
                req,
                showHiddenFields,
              }) => {
                const childrenText = await convertLexicalNodesToHTML({
                  converters,
                  currentDepth,
                  depth,
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
