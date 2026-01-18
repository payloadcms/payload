import type { I18nClient } from '@payloadcms/translations';
import { type ClientFieldSchemaMap, type FieldSchemaMap, type Payload } from 'payload';
import type { SanitizedServerEditorConfig } from '../lexical/config/types.js';
import type { FeatureClientSchemaMap, LexicalRichTextFieldProps } from '../types.js';
type Args = {
    clientFieldSchemaMap: ClientFieldSchemaMap;
    fieldSchemaMap: FieldSchemaMap;
    i18n: I18nClient;
    path: string;
    payload: Payload;
    sanitizedEditorConfig: SanitizedServerEditorConfig;
    schemaPath: string;
};
export declare function initLexicalFeatures(args: Args): {
    clientFeatures: LexicalRichTextFieldProps['clientFeatures'];
    featureClientImportMap: Record<string, any>;
    featureClientSchemaMap: FeatureClientSchemaMap;
};
export {};
//# sourceMappingURL=initLexicalFeatures.d.ts.map