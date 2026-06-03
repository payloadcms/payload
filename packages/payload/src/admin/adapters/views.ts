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
 * One entry in a framework's `ViewAdapter`. Pairs a React component with
 * a metadata generator. `TComponentProps` and `TMetadata` are framework-specific
 * (Next narrows `TMetadata` to `next`'s `Metadata` type).
 */
export type View<TComponentProps = any, TMetadata = unknown> = {
  Component: React.ComponentType<TComponentProps>
  generateMetadata: (args: Parameters<GenerateMetadataDescriptor>[0]) => Promise<TMetadata>
}

/**
 * The canonical set of admin view keys that every framework adapter must implement.
 * Adding a new admin view requires adding its key here so all adapters stay in sync.
 */
export type ViewKey =
  | 'account'
  | 'createFirstUser'
  | 'dashboard'
  | 'forgot'
  | 'login'
  | 'logout'
  | 'logoutInactivity'
  | 'notFound'
  | 'reset'
  | 'unauthorized'
  | 'unauthorizedWithGutter'
  | 'verify'

/**
 * Keyed map of `View` — exactly one entry per `ViewKey`.
 * Framework adapters export an instance of this; missing or misspelled keys are
 * a type error.
 */
export type ViewAdapter<TComponentProps = any, TMetadata = unknown> = Record<
  ViewKey,
  View<TComponentProps, TMetadata>
>