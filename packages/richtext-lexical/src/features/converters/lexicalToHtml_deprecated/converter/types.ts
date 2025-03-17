import type { SerializedLexicalNode } from 'lexical'
import type { PayloadRequest } from 'payload'

/**
 * @deprecated - will be removed in 4.0
 */
export type HTMLConverter<T extends SerializedLexicalNode = SerializedLexicalNode> = {
  converter: (args: {
    childIndex: number
    converters: HTMLConverter<any>[]
    currentDepth: number
    depth: number
    draft: boolean
    node: T
    overrideAccess: boolean
    parent: SerializedLexicalNodeWithParent
    /**
     * When the converter is called, req CAN be passed in depending on where it's run.
     */
    req: null | PayloadRequest
    showHiddenFields: boolean
  }) => Promise<string> | string
  nodeTypes: string[]
}

export type SerializedLexicalNodeWithParent = {
  parent?: SerializedLexicalNode
} & SerializedLexicalNode
