import type { SerializedLexicalNode } from 'lexical'
export type SerializedLexicalNodeWithParent = {
  parent?: SerializedLexicalNode
} & SerializedLexicalNode
