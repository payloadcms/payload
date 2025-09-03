import type { DocumentEvent, FieldSchemaJSON } from 'payload'

export type CollectionPopulationRequestHandler = ({
  apiPath,
  data,
  endpoint,
  serverURL,
}: {
  apiPath: string
  /**
   * If data is passed, fetch will be sent as a POST request
   * @todo make this required and default in v4
   */
  data?: Record<string, any>
  endpoint: string
  /**
   * endpoint that will be used if data is passed
   * @todo make this required and default in v4
   */
  postEndpoint?: string
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
