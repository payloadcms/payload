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
  /**
   * Rendered React element for the component. Serialized to RSC at the
   * server-action boundary by Next.js — not by `renderFields` itself.
   */
  payload: unknown
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
