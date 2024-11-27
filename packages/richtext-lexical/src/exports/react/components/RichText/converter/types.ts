import type { SerializedLexicalNode } from 'lexical'

import type {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedInlineBlockNode,
} from '../../../../../nodeTypes.js'
export type JSXConverter<T extends { [key: string]: any; type?: string } = SerializedLexicalNode> =
  (args: {
    childIndex: number
    converters: JSXConverters
    node: T
    nodesToJSX: (args: {
      converters?: JSXConverters
      disableIndent?: boolean | string[]
      disableTextAlign?: boolean | string[]
      nodes: SerializedLexicalNode[]
      parent?: SerializedLexicalNodeWithParent
    }) => React.ReactNode[]
    parent: SerializedLexicalNodeWithParent
  }) => React.ReactNode

export type JSXConverters<
  T extends { [key: string]: any; type?: string } =
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
  [nodeType in Exclude<NonNullable<T['type']>, 'block' | 'inlineBlock'>]?: JSXConverter<
    Extract<T, { type: nodeType }>
  >
} & {
  blocks?: {
    [K in Extract<
      T extends { type: 'block' }
        ? T extends SerializedBlockNode<infer B>
          ? B extends { blockType: string }
            ? B['blockType']
            : never
          : never
        : never,
      string
    >]?: JSXConverter<
      T extends SerializedBlockNode<any>
        ? SerializedBlockNode<
            Extract<T extends SerializedBlockNode<infer B> ? B : never, { blockType: K }>
          >
        : SerializedBlockNode
    >
  }
  inlineBlocks?: {
    [K in Extract<
      T extends { type: 'inlineBlock' }
        ? T extends SerializedInlineBlockNode<infer B>
          ? B extends { blockType: string }
            ? B['blockType']
            : never
          : never
        : never,
      string
    >]?: JSXConverter<
      T extends SerializedInlineBlockNode<any>
        ? SerializedInlineBlockNode<
            Extract<T extends SerializedInlineBlockNode<infer B> ? B : never, { blockType: K }>
          >
        : SerializedInlineBlockNode
    >
  }
}

export type SerializedLexicalNodeWithParent = {
  parent?: SerializedLexicalNode
} & SerializedLexicalNode
