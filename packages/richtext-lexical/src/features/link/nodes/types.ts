import type { SerializedElementNode, SerializedLexicalNode, Spread } from 'lexical'
import type { DefaultDocumentIDType, JsonValue } from 'payload'

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

export type SerializedLinkNode<T extends SerializedLexicalNode = SerializedLexicalNode> = Spread<
  {
    fields: LinkFields
    /**
     * @todo make required in 4.0 and type AutoLinkNode differently
     */
    id?: string // optional if AutoLinkNode
    type: 'link'
  },
  SerializedElementNode<T>
>
export type SerializedAutoLinkNode<T extends SerializedLexicalNode = SerializedLexicalNode> = {
  type: 'autolink'
} & Omit<SerializedLinkNode<T>, 'id' | 'type'>
