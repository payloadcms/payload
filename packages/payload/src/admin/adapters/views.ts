import type { I18nClient } from '@payloadcms/translations'
import type React from 'react'

import type { SanitizedConfig } from '../../config/types.js'

/**
 * Framework-agnostic metadata descriptor returned by ui-side `generateXMetadata`
 * functions. Each framework adapter formats this into its own metadata shape
 * (e.g. Next.js's `Metadata` type) inside the per-view adapter entry.
 */
export type MetadataDescriptor = {
  description?: string
  keywords?: string
  openGraph?: {
    description?: string
    images?: Array<{
      alt?: string
      height?: number
      url: string
      width?: number
    }>
    siteName?: string
    title?: string
  }
  serverURL?: string
  title?: string
}

/**
 * Signature for ui-side view metadata generators. Returns a framework-agnostic
 * `MetadataDescriptor` that adapter-side code formats into framework metadata.
 */
export type GenerateMetadataDescriptor = (args: {
  config: SanitizedConfig
  i18n: I18nClient
  isEditing?: boolean
  params?: { [key: string]: string | string[] }
}) => Promise<MetadataDescriptor>

/**
 * One entry in a framework adapter's `adminViews` map. Pairs a React component
 * with a metadata generator. `TComponentProps` and `TMetadata` are framework-
 * specific (Next narrows `TMetadata` to `next`'s `Metadata` type).
 */
export type AdminViewAdapterEntry<TComponentProps = any, TMetadata = unknown> = {
  Component: React.ComponentType<TComponentProps>
  generateMetadata: (args: Parameters<GenerateMetadataDescriptor>[0]) => Promise<TMetadata>
}

/**
 * Keyed map of `AdminViewAdapterEntry` — one entry per admin view (logout,
 * dashboard, account, etc.). Framework adapters export an instance of this.
 */
export type AdminViewAdapterMap = Record<string, AdminViewAdapterEntry>