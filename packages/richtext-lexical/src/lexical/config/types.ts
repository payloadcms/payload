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
import type { LexicalFieldAdminClientProps } from '../../types.js'

export type ServerEditorConfig = {
  features: FeatureProviderServer<any, any, any>[]
  lexical?: LexicalEditorConfig | undefined // If undefined, the default lexical editor config will be used. This can be undefined so that we do not send the default lexical editor config to the client.
}

export type SanitizedServerEditorConfig = {
  features: SanitizedServerFeatures
  lexical: LexicalEditorConfig | undefined // If undefined, the default lexical editor config will be used. This can be undefined so that we do not send the default lexical editor config to the client.
  resolvedFeatureMap: ResolvedServerFeatureMap
}

export type ClientEditorConfig = {
  features: FeatureProviderClient<any, any>[]
  lexical?: LexicalEditorConfig
}

export type SanitizedClientEditorConfig = {
  admin?: LexicalFieldAdminClientProps
  features: SanitizedClientFeatures
  lexical: LexicalEditorConfig
  resolvedFeatureMap: ResolvedClientFeatureMap
}
