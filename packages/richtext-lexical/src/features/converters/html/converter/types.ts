import type { SerializedLexicalNode } from 'lexical'
import type { Payload } from 'payload'

export type HTMLConverter<T extends SerializedLexicalNode = SerializedLexicalNode> = {
  converter: ({
    childIndex,
    converters,
    node,
    parent,
    payload,
  }: {
    childIndex: number
    converters: HTMLConverter[]
    node: T
    parent: SerializedLexicalNodeWithParent
    /**
     * When the converter is called, payload CAN be passed in depending on where it's run.
     */
    payload: Payload | null
  }) => Promise<string> | string
  nodeTypes: string[]
}

export type SerializedLexicalNodeWithParent = SerializedLexicalNode & {
  parent?: SerializedLexicalNode
}
