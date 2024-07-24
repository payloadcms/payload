import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import type { PayloadComponent } from 'payload'

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

export type LexicalPluginNodeConverterProps = {
  componentKey: string
  featureKey: string
}

export type LexicalPluginNodeConverterProvider = {
  ClientConverter: PayloadComponent<LexicalPluginNodeConverterProps>
  converter: LexicalPluginNodeConverter
}
