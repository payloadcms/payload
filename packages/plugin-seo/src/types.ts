import type { DocumentInfoContext } from '@payloadcms/ui'
import type { Field, PayloadRequest, TextareaField, TextField, UploadField } from 'payload'

export type PartialDocumentInfoContext = Pick<
  DocumentInfoContext,
  | 'docPermissions'
  | 'hasPublishPermission'
  | 'hasSavePermission'
  | 'id'
  | 'initialData'
  | 'initialState'
  | 'preferencesKey'
  | 'publishedDoc'
  | 'slug'
  | 'title'
  | 'versionsCount'
>

export type GenerateTitle<T = any> = (
  args: { doc: T; locale?: string; req: PayloadRequest } & PartialDocumentInfoContext,
) => Promise<string> | string

export type GenerateDescription<T = any> = (
  args: {
    doc: T
    locale?: string
    req: PayloadRequest
  } & PartialDocumentInfoContext,
) => Promise<string> | string

export type GenerateImage<T = any> = (
  args: { doc: T; locale?: string; req: PayloadRequest } & PartialDocumentInfoContext,
) => Promise<string> | string

export type GenerateURL<T = any> = (
  args: { doc: T; locale?: string; req: PayloadRequest } & PartialDocumentInfoContext,
) => Promise<string> | string

export type SEOPluginConfig = {
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

export type Meta = {
  description?: string
  image?: any // TODO: type this
  keywords?: string
  title?: string
}
