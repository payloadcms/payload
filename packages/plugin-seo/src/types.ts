import type { ContextType } from 'payload/dist/admin/components/utilities/DocumentInfo/types'
import type { Field } from 'payload/dist/fields/config/types'

export type GenerateTitle = <T = any>(
  args: ContextType & { doc: T; locale?: string },
) => string | Promise<string>

export type GenerateDescription = <T = any>(
  args: ContextType & {
    doc: T
    locale?: string
  },
) => string | Promise<string>

export type GenerateImage = <T = any>(
  args: ContextType & { doc: T; locale?: string },
) => string | Promise<string>

export type GenerateURL = <T = any>(
  args: ContextType & { doc: T; locale?: string },
) => string | Promise<string>

export interface PluginConfig {
  collections?: string[]
  globals?: string[]
  uploadsCollection?: string
  fields?: Field[]
  tabbedUI?: boolean
  generateTitle?: GenerateTitle
  generateDescription?: GenerateDescription
  generateImage?: GenerateImage
  generateURL?: GenerateURL
}

export interface Meta {
  title?: string
  description?: string
  keywords?: string
  image?: any // TODO: type this
}
