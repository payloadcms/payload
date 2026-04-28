import type { ComponentSlot } from '../../config/buildComponentIndex.js'

export type RenderFieldsSlot = ComponentSlot

export type RenderFieldsTarget = {
  path: string
  slot: RenderFieldsSlot
}

export type RenderFieldsRequest = {
  collectionSlug?: string
  documentId?: number | string
  fallbackLocale?: string
  globalSlug?: string
  locale?: string
  render: RenderFieldsTarget[]
}

export type RenderedFieldEntry = {
  path: string
  /** RSC payload string (text/x-component) for the rendered component. */
  payload: string
  slot: RenderFieldsSlot
}

export type RenderFieldsError = {
  message: string
  path: string
  slot: RenderFieldsSlot
}

export type RenderFieldsResponse = {
  errors?: RenderFieldsError[]
  rendered: RenderedFieldEntry[]
}
