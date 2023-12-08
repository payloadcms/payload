import type { i18n as Ii18n } from 'i18next'
import type { SanitizedConfig } from 'payload/config'
import type { Field, RichTextFieldProps } from 'payload/types'
import type { Editor } from 'slate'

export type TextNode = { [x: string]: unknown; text: string }

export type ElementNode = { children: (ElementNode | TextNode)[]; type?: string }

export function nodeIsTextNode(node: ElementNode | TextNode): node is TextNode {
  return 'text' in node
}

type RichTextPlugin = (editor: Editor) => Editor

export type RichTextCustomElement = {
  Button: React.ComponentType<any>
  Element: React.ComponentType<any>
  name: string
  plugins?: RichTextPlugin[]
}

export type RichTextCustomLeaf = {
  Button: React.ComponentType<any>
  Leaf: React.ComponentType<any>
  name: string
  plugins?: RichTextPlugin[]
}

export type RichTextElement =
  | 'blockquote'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'indent'
  | 'link'
  | 'ol'
  | 'relationship'
  | 'textAlign'
  | 'ul'
  | 'upload'
  | RichTextCustomElement
export type RichTextLeaf =
  | 'bold'
  | 'code'
  | 'italic'
  | 'strikethrough'
  | 'underline'
  | RichTextCustomLeaf

export type AdapterArguments = {
  admin?: {
    elements?: RichTextElement[]
    hideGutter?: boolean
    leaves?: RichTextLeaf[]
    link?: {
      fields?:
        | ((args: { config: SanitizedConfig; defaultFields: Field[]; i18n: Ii18n }) => Field[])
        | Field[]
    }
    placeholder?: Record<string, string> | string
    rtl?: boolean
    upload?: {
      collections: {
        [collection: string]: {
          fields: Field[]
        }
      }
    }
  }
}

export type FieldProps = RichTextFieldProps<any[], AdapterArguments, AdapterArguments>
