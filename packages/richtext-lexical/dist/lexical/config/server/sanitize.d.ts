import type { SanitizedConfig } from 'payload';
import type { ResolvedServerFeatureMap, SanitizedServerFeatures } from '../../../features/typesServer.js';
import type { SanitizedServerEditorConfig, ServerEditorConfig } from '../types.js';
export declare const sanitizeServerFeatures: (features: ResolvedServerFeatureMap) => SanitizedServerFeatures;
export declare function sanitizeServerEditorConfig(editorConfig: ServerEditorConfig, config: SanitizedConfig, parentIsLocalized?: boolean): Promise<SanitizedServerEditorConfig>;
//# sourceMappingURL=sanitize.d.ts.map