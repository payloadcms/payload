import type { EditorConfig as LexicalEditorConfig } from 'lexical';
import type { ResolvedClientFeatureMap, SanitizedClientFeatures } from '../../../features/typesClient.js';
import type { LexicalFieldAdminClientProps } from '../../../types.js';
import type { SanitizedClientEditorConfig } from '../types.js';
export declare const sanitizeClientFeatures: (features: ResolvedClientFeatureMap) => SanitizedClientFeatures;
export declare function sanitizeClientEditorConfig(resolvedClientFeatureMap: ResolvedClientFeatureMap, lexical?: LexicalEditorConfig, admin?: LexicalFieldAdminClientProps): SanitizedClientEditorConfig;
//# sourceMappingURL=sanitize.d.ts.map