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
    lexicalPluginNode: SerializedLexicalNode
    parentNodeType: string
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
