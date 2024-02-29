import type { Field, TextField, TextareaField, UploadField } from 'payload/types'

import type { DocumentInfoContext } from '../../ui/src/providers/DocumentInfo/types'

export type GenerateTitle = <T = any>(
  args: DocumentInfoContext & { doc: T; locale?: string },
) => Promise<string> | string

export type GenerateDescription = <T = any>(
  args: DocumentInfoContext & {
    doc: T
    locale?: string
  },
) => Promise<string> | string

export type GenerateImage = <T = any>(
  args: DocumentInfoContext & { doc: T; locale?: string },
) => Promise<string> | string

export type GenerateURL = <T = any>(
  args: DocumentInfoContext & { doc: T; locale?: string },
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
