import type { DocumentEvent, FieldSchemaJSON } from 'payload'

export type CollectionPopulationRequestHandler = ({
  apiPath,
  endpoint,
  serverURL,
}: {
  apiPath: string
  endpoint: string
  serverURL: string
}) => Promise<Response>

export type LivePreviewArgs = {}

export type LivePreview = void

export type LivePreviewMessageEvent<T> = MessageEvent<{
  collectionSlug?: string
  data: T
  externallyUpdatedRelationship?: DocumentEvent
  fieldSchemaJSON: FieldSchemaJSON
  globalSlug?: string
  locale?: string
  type: 'payload-live-preview'
}>
