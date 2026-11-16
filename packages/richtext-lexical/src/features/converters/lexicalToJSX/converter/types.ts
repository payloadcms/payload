import type { SerializedLexicalNode } from 'lexical'

import type {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedInlineBlockNode,
} from '../../../../types/nodeTypes.js'

export type JSXConverterArgs<
  TNode extends { [key: string]: any; type?: string } = SerializedLexicalNode,
> = {
  childIndex: number
  converters: JSXConverters
  node: TNode
  nodesToJSX: (args: {
    converters?: JSXConverters
    disableIndent?: boolean | string[]
    disableTextAlign?: boolean | string[]
    nodes: SerializedLexicalNode[]
    parent?: SerializedLexicalNodeWithParent
  }) => React.ReactNode[]
  parent: SerializedLexicalNodeWithParent
}
export type JSXConverter<
  TNode extends { [key: string]: any; type?: string } = SerializedLexicalNode,
> = ((args: JSXConverterArgs<TNode>) => React.ReactNode) | React.ReactNode

export type JSXConverters<
  TNodes extends { [key: string]: any; type?: string } =
    | DefaultNodeTypes
    | SerializedBlockNode<{ blockName?: null | string; blockType: string }> // need these to ensure types for blocks and inlineBlocks work if no generics are provided
    | SerializedInlineBlockNode<{ blockName?: null | string; blockType: string }>, // need these to ensure types for blocks and inlineBlocks work if no generics are provided
> = {
  [key: string]:
    | {
        [blockSlug: string]: JSXConverter<any>
      }
    | JSXConverter<any>
    | undefined
} & {
  [nodeType in Exclude<NonNullable<TNodes['type']>, 'block' | 'inlineBlock'>]?: JSXConverter<
    Extract<TNodes, { type: nodeType }>
  >
} & {
  blocks?: {
    [K in Extract<TNodes, { type: 'block' }>['fields']['blockType']]?: JSXConverter<
      Extract<TNodes, { fields: { blockType: K }; type: 'block' }>
    >
  }
  inlineBlocks?: {
    [K in Extract<TNodes, { type: 'inlineBlock' }>['fields']['blockType']]?: JSXConverter<
      Extract<TNodes, { fields: { blockType: K }; type: 'inlineBlock' }>
    >
  }
  unknown?: JSXConverter<SerializedLexicalNode>
}
export type SerializedLexicalNodeWithParent = {
  parent?: SerializedLexicalNode
} & SerializedLexicalNode
