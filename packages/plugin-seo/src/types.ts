import { Field } from "payload/dist/fields/config/types";

export type PluginConfig = {
  collections?: string[]
  globals?: string[]
  uploadsCollection?: string
  fields?: Partial<Field>[]
  tabbedUI?: boolean
  generateTitle?: <T = any>(args: { doc: T, locale?: string }) => string | Promise<string>
  generateDescription?: <T = any>(args: { doc: T, locale?: string }) => string | Promise<string>
  generateImage?: <T = any>(args: { doc: T, locale?: string }) => string | Promise<string>
  generateURL?: <T = any>(args: { doc: T, locale?: string }) => string | Promise<string>
}

export type Meta = {
  title?: string
  description?: string
  keywords?: string
  image?: any // TODO: type this
}
