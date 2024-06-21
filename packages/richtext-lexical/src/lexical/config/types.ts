import type { EditorConfig as LexicalEditorConfig } from 'lexical'

import type {
  FeatureProviderClient,
  FeatureProviderServer,
  ResolvedClientFeatureMap,
  ResolvedServerFeatureMap,
  SanitizedClientFeatures,
  SanitizedServerFeatures,
} from '../../features/types.js'
import type { LexicalFieldAdminProps } from '../../types.js'

export type ServerEditorConfig = {
  features: FeatureProviderServer<unknown, unknown, unknown>[]
  lexical?: LexicalEditorConfig
}

export type SanitizedServerEditorConfig = {
  features: SanitizedServerFeatures
  lexical: LexicalEditorConfig
  resolvedFeatureMap: ResolvedServerFeatureMap
}

export type ClientEditorConfig = {
  features: FeatureProviderClient<unknown, unknown>[]
  lexical?: LexicalEditorConfig
}

export type SanitizedClientEditorConfig = {
  admin?: LexicalFieldAdminProps
  features: SanitizedClientFeatures
  lexical: LexicalEditorConfig
  resolvedFeatureMap: ResolvedClientFeatureMap
}
