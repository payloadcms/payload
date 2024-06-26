import type { EditorConfig as LexicalEditorConfig } from 'lexical'

import type {
  FeatureProviderClient,
  ResolvedClientFeatureMap,
  SanitizedClientFeatures,
} from '../../features/typesClient.js'
import type {
  FeatureProviderServer,
  ResolvedServerFeatureMap,
  SanitizedServerFeatures,
} from '../../features/typesServer.js'
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
