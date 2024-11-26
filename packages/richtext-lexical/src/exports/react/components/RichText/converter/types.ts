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
export type JSXConverters<T extends { [key: string]: any; type?: string } = DefaultNodeTypes> = {
  [key: string]:
    | {
        [blockSlug: string]: JSXConverter<any> // Not true, but need to appease TypeScript
      }
    | JSXConverter<any>
    | undefined
} & {
  [nodeType in NonNullable<T['type']>]?: JSXConverter<Extract<T, { type: nodeType }>>
} & {
  blocks?: {
    [blockSlug: string]: JSXConverter<{ fields: Record<string, any> } & SerializedBlockNode>
  }
  inlineBlocks?: {
    [blockSlug: string]: JSXConverter<{ fields: Record<string, any> } & SerializedInlineBlockNode>
  }
}

export type SerializedLexicalNodeWithParent = {
  parent?: SerializedLexicalNode
} & SerializedLexicalNode
