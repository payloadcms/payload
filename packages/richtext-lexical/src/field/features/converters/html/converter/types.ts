import type { SerializedLexicalNode } from 'lexical'

export type HTMLConverter<T extends SerializedLexicalNode = SerializedLexicalNode> = {
  converter: ({
    childIndex,
    converters,
    node,
    parent,
  }: {
    childIndex: number
    converters: HTMLConverter[]
    node: T
    parent: SerializedLexicalNodeWithParent
  }) => Promise<string> | string
  nodeTypes: string[]
}

export type SerializedLexicalNodeWithParent = SerializedLexicalNode & {
  parent?: SerializedLexicalNode
}
