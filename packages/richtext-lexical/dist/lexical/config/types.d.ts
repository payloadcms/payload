import type { EditorConfig as LexicalEditorConfig } from 'lexical';
import type { FeatureProviderClient, ResolvedClientFeatureMap, SanitizedClientFeatures } from '../../features/typesClient.js';
import type { FeatureProviderServer, ResolvedServerFeatureMap, SanitizedServerFeatures } from '../../features/typesServer.js';
import type { LexicalFieldAdminClientProps } from '../../types.js';
export type ServerEditorConfig = {
    features: FeatureProviderServer<any, any, any>[];
    lexical?: LexicalEditorConfig | undefined;
};
export type SanitizedServerEditorConfig = {
    features: SanitizedServerFeatures;
    lexical: LexicalEditorConfig | undefined;
    resolvedFeatureMap: ResolvedServerFeatureMap;
};
export type ClientEditorConfig = {
    features: FeatureProviderClient<any, any>[];
    lexical?: LexicalEditorConfig;
};
export type SanitizedClientEditorConfig = {
    admin?: LexicalFieldAdminClientProps;
    features: SanitizedClientFeatures;
    lexical: LexicalEditorConfig;
    resolvedFeatureMap: ResolvedClientFeatureMap;
};
//# sourceMappingURL=types.d.ts.map