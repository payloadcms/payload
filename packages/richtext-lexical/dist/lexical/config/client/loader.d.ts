import type { ClientConfig, RichTextFieldClient } from 'payload';
import type { ResolvedClientFeatureMap } from '../../../features/typesClient.js';
import type { FeatureClientSchemaMap } from '../../../types.js';
import type { ClientEditorConfig } from '../types.js';
/**
 * This function expects client functions to ALREADY be ordered & dependencies checked on the server
 * @param unSanitizedEditorConfig
 */
export declare function loadClientFeatures({ config, featureClientImportMap, featureClientSchemaMap, field, schemaPath, unSanitizedEditorConfig, }: {
    config: ClientConfig;
    featureClientImportMap: Record<string, any>;
    featureClientSchemaMap: FeatureClientSchemaMap;
    field?: RichTextFieldClient;
    schemaPath: string;
    unSanitizedEditorConfig: ClientEditorConfig;
}): ResolvedClientFeatureMap;
//# sourceMappingURL=loader.d.ts.map