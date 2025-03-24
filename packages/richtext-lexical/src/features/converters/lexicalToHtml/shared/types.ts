import type { SerializedLexicalNode } from 'lexical'

export type ProvidedCSS = {
  'padding-inline-start'?: string
  'text-align'?: string
}

export type SerializedLexicalNodeWithParent = {
  parent?: SerializedLexicalNode
} & SerializedLexicalNode
