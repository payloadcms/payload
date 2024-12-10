import type { SerializedLexicalNode } from 'lexical'

export type SlateNodeConverter<T extends SerializedLexicalNode = SerializedLexicalNode> = {
  converter: ({
    childIndex,
    converters,
    parentNodeType,
    slateNode,
  }: {
    childIndex: number
    converters: SlateNodeConverter[]
    parentNodeType: string
    slateNode: SlateNode
  }) => T
  nodeTypes: string[]
}

export type SlateNode = {
  [key: string]: any
  children?: SlateNode[]
  type?: string // doesn't always have type, e.g. for paragraphs
}
