import type { I18nClient } from '@payloadcms/translations'
import type React from 'react'

import type { MetaConfig, SanitizedConfig } from '../../config/types.js'

/**
 * Signature for ui-side view metadata generators. Returns a framework-agnostic
 * `MetaConfig` that adapter-side code formats into framework metadata.
 */
export type GenerateViewMetadata = (args: {
  config: SanitizedConfig
  i18n: I18nClient
  isEditing?: boolean
  params?: { [key: string]: string | string[] }
}) => Promise<MetaConfig>

/**
 * One entry in a framework's `AdminViewAdapter`. Pairs a React component with
 * a metadata generator. `TComponentProps` and `TMetadata` are framework-specific
 * (Next narrows `TMetadata` to `next`'s `Metadata` type).
 */
export type AdminView<TComponentProps = any, TMetadata = unknown> = {
  Component: React.ComponentType<TComponentProps>
  generateMetadata: (args: Parameters<GenerateViewMetadata>[0]) => Promise<TMetadata>
}

/**
 * The canonical set of admin view keys that every framework adapter must implement.
 * Adding a new admin view requires adding its key here so all adapters stay in sync.
 */
export type AdminViewKey =
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
 * Keyed map of `AdminView` — exactly one entry per `AdminViewKey`.
 * Framework adapters export an instance of this; missing or misspelled keys are
 * a type error.
 */
export type AdminViewAdapter<TComponentProps = any, TMetadata = unknown> = Record<
  AdminViewKey,
  AdminView<TComponentProps, TMetadata>
>
