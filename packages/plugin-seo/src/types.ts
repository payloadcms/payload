import type { ContextType } from 'payload/dist/admin/components/utilities/DocumentInfo/types'
import type { Field, TextareaField, TextField, UploadField } from 'payload/dist/fields/config/types'

export type GenerateTitle = <T = any>(
  args: ContextType & { doc: T; locale?: string },
) => Promise<string> | string

export type GenerateDescription = <T = any>(
  args: ContextType & {
    doc: T
    locale?: string
  },
) => Promise<string> | string

export type GenerateImage = <T = any>(
  args: ContextType & { doc: T; locale?: string },
) => Promise<string> | string

export type GenerateURL = <T = any>(
  args: ContextType & { doc: T; locale?: string },
) => Promise<string> | string

export interface PluginConfig {
  collections?: string[]
  fields?: Field[]
  generateDescription?: GenerateDescription
  generateImage?: GenerateImage
  generateTitle?: GenerateTitle
  generateURL?: GenerateURL
  globals?: string[]
  tabbedUI?: boolean
  fieldOverrides?: {
    title?: Partial<TextField>
    description?: Partial<TextareaField>
    image?: Partial<UploadField>
  }
  interfaceName?: string
  uploadsCollection?: string
}

export interface Meta {
  description?: string
  image?: any // TODO: type this
  keywords?: string
  title?: string
}
