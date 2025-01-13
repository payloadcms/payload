import type { DocumentEvent, FieldSchemaJSON } from 'payload'

export type LivePreviewArgs = {}

export type LivePreview = void

export type PopulationsByCollection = {
  [slug: string]: Array<{
    accessor: number | string
    id: number | string
    ref: Record<string, unknown>
  }>
}

export type LivePreviewMessageEvent<T> = MessageEvent<{
  data: T
  externallyUpdatedRelationship?: DocumentEvent
  fieldSchemaJSON: FieldSchemaJSON
  locale?: string
  type: 'payload-live-preview'
}>
