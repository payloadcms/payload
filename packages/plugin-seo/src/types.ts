import type { ContextType } from 'payload/dist/admin/components/utilities/DocumentInfo/types'
import type { Field } from 'payload/dist/fields/config/types'

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
  uploadsCollection?: string
}

export interface Meta {
  description?: string
  image?: any // TODO: type this
  keywords?: string
  title?: string
}
