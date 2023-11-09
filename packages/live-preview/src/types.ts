import type { fieldSchemaToJSON } from 'payload/utilities'

export type MergeLiveDataArgs<T> = {
  apiRoute?: string
  depth?: number
  fieldSchema: ReturnType<typeof fieldSchemaToJSON>
  incomingData: Partial<T>
  initialData: T
  returnNumberOfRequests?: boolean
  serverURL: string
}

export type LivePreview = void
