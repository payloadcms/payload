import { Field } from "payload/dist/fields/config/types";

export type SEOConfig = {
  collections?: string[]
  uploadsCollection?: string
  fields?: Partial<Field>[]
  generateTitle?: (args: { doc: any }) => string | Promise<string>
  generateDescription?: (args: { doc: any }) => string | Promise<string>
  generateImage?: (args: { doc: any }) => string | Promise<string>
}
