import type { ContextType } from 'payload/dist/admin/components/utilities/DocumentInfo/types'
import type { Field } from 'payload/dist/fields/config/types'
import type { Fields, FormField } from 'payload/dist/admin/components/forms/Form/types'

type GetFormFields<T> = {
  [K in keyof T]: T[K] extends object
    ? T[K] extends any[]
      ? GetFormFields<T[K]>[]
      : GetFormFields<T[K]>
    : FormField
}

export type GenerateTitle<T = any> = (
  args: ContextType & { doc: GetFormFields<T>; locale?: string },
) => Promise<string> | string

export type GenerateDescription = (
  args: ContextType & {
    doc: Fields
    locale?: string
  },
) => Promise<string> | string

export type GenerateImage = (
  args: ContextType & { doc: Fields; locale?: string },
) => Promise<string> | string

export type GenerateURL = (
  args: ContextType & { doc: Fields; locale?: string },
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
