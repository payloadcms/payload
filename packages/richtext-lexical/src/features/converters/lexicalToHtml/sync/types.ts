import type { SerializedLexicalNode } from 'lexical'

import type {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedInlineBlockNode,
} from '../../../../nodeTypes.js'
import type { SerializedLexicalNodeWithParent } from '../shared/types.js'

export type HTMLConverter<T extends { [key: string]: any; type?: string } = SerializedLexicalNode> =

    | ((args: {
        childIndex: number
        converters: HTMLConverters
        node: T
        nodesToHTML: (args: {
          converters?: HTMLConverters
          disableIndent?: boolean | string[]
          disableTextAlign?: boolean | string[]
          nodes: SerializedLexicalNode[]
          parent?: SerializedLexicalNodeWithParent
        }) => string[]
        parent: SerializedLexicalNodeWithParent
        providedCSSString: string
        providedStyleTag: string
      }) => string)
    | string

export type HTMLConverters<
  T extends { [key: string]: any; type?: string } =
    | DefaultNodeTypes
    | SerializedBlockNode<{ blockName?: null | string; blockType: string }> // need these to ensure types for blocks and inlineBlocks work if no generics are provided
    | SerializedInlineBlockNode<{ blockName?: null | string; blockType: string }>, // need these to ensure types for blocks and inlineBlocks work if no generics are provided
> = {
  [key: string]:
    | {
        [blockSlug: string]: HTMLConverter<any>
      }
    | HTMLConverter<any>
    | undefined
} & {
  [nodeType in Exclude<NonNullable<T['type']>, 'block' | 'inlineBlock'>]?: HTMLConverter<
    Extract<T, { type: nodeType }>
  >
} & {
  blocks?: {
    [K in Extract<
      Extract<T, { type: 'block' }> extends SerializedBlockNode<infer B>
        ? B extends { blockType: string }
          ? B['blockType']
          : never
        : never,
      string
    >]?: HTMLConverter<
      Extract<T, { type: 'block' }> extends SerializedBlockNode<infer B>
        ? SerializedBlockNode<Extract<B, { blockType: K }>>
        : SerializedBlockNode
    >
  }
  inlineBlocks?: {
    [K in Extract<
      Extract<T, { type: 'inlineBlock' }> extends SerializedInlineBlockNode<infer B>
        ? B extends { blockType: string }
          ? B['blockType']
          : never
        : never,
      string
    >]?: HTMLConverter<
      Extract<T, { type: 'inlineBlock' }> extends SerializedInlineBlockNode<infer B>
        ? SerializedInlineBlockNode<Extract<B, { blockType: K }>>
        : SerializedInlineBlockNode
    >
  }
  unknown?: HTMLConverter<SerializedLexicalNode>
}

export type HTMLConvertersFunction<
  T extends { [key: string]: any; type?: string } =
    | DefaultNodeTypes
    | SerializedBlockNode<{ blockName?: null | string }>
    | SerializedInlineBlockNode<{ blockName?: null | string; blockType: string }>,
> = (args: { defaultConverters: HTMLConverters<DefaultNodeTypes> }) => HTMLConverters<T>
