import type { SerializedElementNode, SerializedLexicalNode } from 'lexical'
import type { DefaultDocumentIDType, JsonValue } from 'payload'

import type { StronglyTypedElementNode } from '../../../nodeTypes.js'

export type LinkFields = {
  [key: string]: JsonValue
  doc?: {
    relationTo: string
    value:
      | {
          // Actual doc data, populated in afterRead hook
          [key: string]: JsonValue
          id: DefaultDocumentIDType
        }
      | DefaultDocumentIDType
  } | null
  linkType: 'custom' | 'internal'
  newTab: boolean
  url?: string
}

export type SerializedLinkNode<T extends SerializedLexicalNode = SerializedLexicalNode> = {
  fields: LinkFields
  /**
   * @todo make required in 4.0 and type AutoLinkNode differently
   */
  id?: string // optional if AutoLinkNode
} & StronglyTypedElementNode<SerializedElementNode, 'link', T>

export type SerializedAutoLinkNode<T extends SerializedLexicalNode = SerializedLexicalNode> = {
  fields: LinkFields
} & StronglyTypedElementNode<SerializedElementNode, 'autolink', T>
