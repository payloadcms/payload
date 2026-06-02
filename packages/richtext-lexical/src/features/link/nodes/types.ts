import type { SerializedElementNode, SerializedLexicalNode } from 'lexical'
import type { DefaultDocumentIDType, JsonValue } from 'payload'

import type { StronglyTypedElementNode } from '../../../types/nodeTypes.js'

export type LinkFields = {
  [key: string]: JsonValue
  doc?: null | {
    relationTo: string
    value:
      | DefaultDocumentIDType
      | {
          // Actual doc data, populated in afterRead hook
          [key: string]: JsonValue
          id: DefaultDocumentIDType
        }
  }
  linkType: 'custom' | 'internal'
  newTab: boolean
  url?: string
}

export type SerializedLinkNode<T extends SerializedLexicalNode = SerializedLexicalNode> =
  StronglyTypedElementNode<SerializedElementNode, 'link', T> & {
    fields: LinkFields
    /**
     * @todo make required in 4.0 and type AutoLinkNode differently
     */
    id?: string // optional if AutoLinkNode
  }

export type SerializedAutoLinkNode<T extends SerializedLexicalNode = SerializedLexicalNode> =
  StronglyTypedElementNode<SerializedElementNode, 'autolink', T> & {
    fields: LinkFields
  }
