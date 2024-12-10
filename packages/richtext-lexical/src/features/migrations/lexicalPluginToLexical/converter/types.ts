import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

export type LexicalPluginNodeConverter<T extends SerializedLexicalNode = SerializedLexicalNode> = {
  converter: ({
    childIndex,
    converters,
    lexicalPluginNode,
    parentNodeType,
  }: {
    childIndex: number
    converters: LexicalPluginNodeConverter[]
    lexicalPluginNode: { children?: SerializedLexicalNode[] } & SerializedLexicalNode
    parentNodeType: string
    quiet?: boolean
  }) => T
  nodeTypes: string[]
}

export type PayloadPluginLexicalData = {
  characters: number
  comments: unknown[]
  html?: string
  jsonContent: SerializedEditorState
  markdown?: string
  preview: string
  words: number
}
