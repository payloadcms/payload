import type { SerializedLexicalNode } from 'lexical'

export type JSXConverters<T extends SerializedLexicalNode = SerializedLexicalNode> = {
  [nodeType in T['type']]?: (args: {
    childIndex: number
    converters: JSXConverters
    node: Extract<T, { type: nodeType }>
    nodesToJSX: (args: {
      converters?: JSXConverters
      disableIndent?: boolean | string[]
      disableTextAlign?: boolean | string[]
      nodes: SerializedLexicalNode[]
      parent?: SerializedLexicalNodeWithParent
    }) => React.ReactNode[]
    parent: SerializedLexicalNodeWithParent
  }) => React.ReactNode
}

export type SerializedLexicalNodeWithParent = {
  parent?: SerializedLexicalNode
} & SerializedLexicalNode
