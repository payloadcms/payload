import type { SerializedLexicalNode } from 'lexical'

export type HTMLConverter<T extends SerializedLexicalNode = SerializedLexicalNode> = {
  converter: ({
    childIndex,
    converters,
    node,
    parentNodeType,
  }: {
    childIndex: number
    converters: HTMLConverter[]
    node: T
    parentNodeType: string
  }) => Promise<string> | string
  nodeTypes: string[]
}
