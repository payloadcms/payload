import type {
  ClientField,
  Field,
  PayloadComponent,
  RichTextFieldClientProps,
  SanitizedConfig,
} from 'payload'
import type { Editor } from 'slate'

export type TextNode = { [x: string]: unknown; text: string }

export type ElementNode = { children: (ElementNode | TextNode)[]; type?: string }

export function nodeIsTextNode(node: ElementNode | TextNode): node is TextNode {
  return 'text' in node
}

export type RichTextPluginComponent = PayloadComponent
export type RichTextPlugin = (editor: Editor) => Editor

export type RichTextCustomElement = {
  Button?: PayloadComponent
  Element: PayloadComponent
  name: string
  plugins?: RichTextPluginComponent[]
}

export type RichTextCustomLeaf = {
  Button: PayloadComponent
  Leaf: PayloadComponent
  name: string
  plugins?: RichTextPluginComponent[]
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
      fields?: ((args: { config: SanitizedConfig; defaultFields: Field[] }) => Field[]) | Field[]
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

export type SlateFieldProps = {
  componentMap: {
    [x: string]: ClientField[] | React.ReactNode
  }
} & RichTextFieldClientProps<any[], AdapterArguments, AdapterArguments>
