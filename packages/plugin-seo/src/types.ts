import { Field } from "payload/dist/fields/config/types";

export type SEOConfig = {
  collections?: string[]
  uploadsCollection?: string
  fields?: Partial<Field>[]
  generateTitle?: (args: { doc: {} }) => string | Promise<string>
  generateDescription?: (args: { doc: {} }) => string | Promise<string>
  generateImage?: (args: { doc: {} }) => string | Promise<string>
}
