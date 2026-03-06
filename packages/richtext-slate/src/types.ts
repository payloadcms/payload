import type {
  ClientField,
  Field,
  PayloadComponent,
  RichTextFieldClientProps,
  SanitizedConfig,
} from 'payload'
import type { Editor } from 'slate'

/**
 * @deprecated - slate will be removed in 4.0. Please [migrate our new, lexical-based rich text editor](https://payloadcms.com/docs/rich-text/migration#migrating-from-slate).
 */
export type TextNode = { [x: string]: unknown; text: string }

/**
 * @deprecated - slate will be removed in 4.0. Please [migrate our new, lexical-based rich text editor](https://payloadcms.com/docs/rich-text/migration#migrating-from-slate).
 */
export type ElementNode = { children: (ElementNode | TextNode)[]; type?: string }

/**
 * @deprecated - slate will be removed in 4.0. Please [migrate our new, lexical-based rich text editor](https://payloadcms.com/docs/rich-text/migration#migrating-from-slate).
 */
export function nodeIsTextNode(node: ElementNode | TextNode): node is TextNode {
  return 'text' in node
}

/**
 * @deprecated - slate will be removed in 4.0. Please [migrate our new, lexical-based rich text editor](https://payloadcms.com/docs/rich-text/migration#migrating-from-slate).
 */
export type RichTextPluginComponent = PayloadComponent

/**
 * @deprecated - slate will be removed in 4.0. Please [migrate our new, lexical-based rich text editor](https://payloadcms.com/docs/rich-text/migration#migrating-from-slate).
 */
export type RichTextPlugin = (editor: Editor) => Editor

/**
 * @deprecated - slate will be removed in 4.0. Please [migrate our new, lexical-based rich text editor](https://payloadcms.com/docs/rich-text/migration#migrating-from-slate).
 */
export type RichTextCustomElement = {
  Button?: PayloadComponent
  Element: PayloadComponent
  name: string
  plugins?: RichTextPluginComponent[]
}

/**
 * @deprecated - slate will be removed in 4.0. Please [migrate our new, lexical-based rich text editor](https://payloadcms.com/docs/rich-text/migration#migrating-from-slate).
 */
export type RichTextCustomLeaf = {
  Button: PayloadComponent
  Leaf: PayloadComponent
  name: string
  plugins?: RichTextPluginComponent[]
}

/**
 * @deprecated - slate will be removed in 4.0. Please [migrate our new, lexical-based rich text editor](https://payloadcms.com/docs/rich-text/migration#migrating-from-slate).
 */
export type RichTextElement =
  | 'blockquote'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'indent'
  | 'li'
  | 'link'
  | 'ol'
  | 'relationship'
  | 'textAlign'
  | 'ul'
  | 'upload'
  | RichTextCustomElement

/**
 * @deprecated - slate will be removed in 4.0. Please [migrate our new, lexical-based rich text editor](https://payloadcms.com/docs/rich-text/migration#migrating-from-slate).
 */
export type RichTextLeaf =
  | 'bold'
  | 'code'
  | 'italic'
  | 'strikethrough'
  | 'underline'
  | RichTextCustomLeaf

/**
 * @deprecated - slate will be removed in 4.0. Please [migrate our new, lexical-based rich text editor](https://payloadcms.com/docs/rich-text/migration#migrating-from-slate).
 */
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

/**
 * @deprecated - slate will be removed in 4.0. Please [migrate our new, lexical-based rich text editor](https://payloadcms.com/docs/rich-text/migration#migrating-from-slate).
 */
export type SlateFieldProps = {
  componentMap: {
    [x: string]: ClientField[] | React.ReactNode
  }
} & RichTextFieldClientProps<any[], AdapterArguments, AdapterArguments>
