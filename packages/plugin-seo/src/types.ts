import type { ContextType } from 'payload/dist/admin/components/utilities/DocumentInfo/types'
import type { Field, TextField, TextareaField, UploadField } from 'payload/dist/fields/config/types'
import type { FormField } from 'payload/types'

// @todo: update typings in 3.0 to infer collection types as expected for 'doc'
export type GenerateTitle = <T = any>(
  args: ContextType & { doc: Record<string, FormField>; locale?: string },
) => Promise<string> | string

export type GenerateDescription = <T = any>(
  args: ContextType & {
    doc: Record<string, FormField>
    locale?: string
  },
) => Promise<string> | string

export type GenerateImage = <T = any>(
  args: ContextType & { doc: Record<string, FormField>; locale?: string },
) => Promise<string> | string

export type GenerateURL = <T = any>(
  args: ContextType & { doc: Record<string, FormField>; locale?: string },
) => Promise<string> | string

export interface PluginConfig {
  collections?: string[]
  fieldOverrides?: {
    description?: Partial<TextareaField>
    image?: Partial<UploadField>
    title?: Partial<TextField>
  }
  fields?: Field[]
  generateDescription?: GenerateDescription
  generateImage?: GenerateImage
  generateTitle?: GenerateTitle
  generateURL?: GenerateURL
  globals?: string[]
  interfaceName?: string
  tabbedUI?: boolean
  uploadsCollection?: string
}

export interface Meta {
  description?: string
  image?: any // TODO: type this
  keywords?: string
  title?: string
}
