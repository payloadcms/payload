import type { SerializedLexicalNode } from 'lexical'
export type SerializedLexicalNodeWithParent = SerializedLexicalNode & {
  parent?: SerializedLexicalNode
}
