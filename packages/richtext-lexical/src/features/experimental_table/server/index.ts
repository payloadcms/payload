import type {
  SerializedTableCellNode as _SerializedTableCellNode,
  SerializedTableNode as _SerializedTableNode,
  SerializedTableRowNode as _SerializedTableRowNode,
} from '@lexical/table'
import type { SerializedLexicalNode } from 'lexical'
import type { Config, Field, FieldSchemaMap } from 'payload'

import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { sanitizeFields } from 'payload'

import type { StronglyTypedElementNode } from '../../../nodeTypes.js'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
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

export type SerializedTableCellNode<T extends SerializedLexicalNode = SerializedLexicalNode> =
  StronglyTypedElementNode<_SerializedTableCellNode, 'tablecell', T>

export type SerializedTableNode<T extends SerializedLexicalNode = SerializedLexicalNode> =
  StronglyTypedElementNode<_SerializedTableNode, 'table', T>

export type SerializedTableRowNode<T extends SerializedLexicalNode = SerializedLexicalNode> =
  StronglyTypedElementNode<_SerializedTableRowNode, 'tablerow', T>
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
          node: TableNode,
        }),
        createNode({
          node: TableCellNode,
        }),
        createNode({
          node: TableRowNode,
        }),
      ],
    }
  },
  key: 'experimental_table',
})
