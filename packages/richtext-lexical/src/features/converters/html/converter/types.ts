import type { SerializedLexicalNode } from 'lexical'
import type { Payload, PayloadRequest } from 'payload'

export type HTMLConverter<T extends SerializedLexicalNode = SerializedLexicalNode> = {
  converter: ({
    childIndex,
    converters,
    node,
    parent,
    req,
  }: {
    childIndex: number
    converters: HTMLConverter[]
    node: T
    parent: SerializedLexicalNodeWithParent
    /**
     * When the converter is called, req CAN be passed in depending on where it's run.
     */
    req: PayloadRequest | null
  }) => Promise<string> | string
  nodeTypes: string[]
}

export type SerializedLexicalNodeWithParent = SerializedLexicalNode & {
  parent?: SerializedLexicalNode
}
