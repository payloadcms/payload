import type { ClientConfig, RichTextFieldClient } from 'payload';
import type { BaseClientFeatureProps, ClientFeature, ClientFeatureProviderMap, FeatureProviderProviderClient, ResolvedClientFeatureMap } from '../features/typesClient.js';
import type { ClientEditorConfig } from '../lexical/config/types.js';
import type { FeatureClientSchemaMap } from '../types.js';
export type CreateClientFeatureArgs<UnSanitizedClientProps, ClientProps> = ((props: {
    config: ClientConfig;
    featureClientImportMap: Record<string, any>;
    featureClientSchemaMap: FeatureClientSchemaMap;
    /** unSanitizedEditorConfig.features, but mapped */
    featureProviderMap: ClientFeatureProviderMap;
    field?: RichTextFieldClient;
    props: BaseClientFeatureProps<UnSanitizedClientProps>;
    resolvedFeatures: ResolvedClientFeatureMap;
    schemaPath: string;
    unSanitizedEditorConfig: ClientEditorConfig;
}) => ClientFeature<ClientProps>) | Omit<ClientFeature<ClientProps>, 'sanitizedClientFeatureProps'>;
export declare const createClientFeature: <UnSanitizedClientProps = undefined, ClientProps = UnSanitizedClientProps>(args: CreateClientFeatureArgs<UnSanitizedClientProps, ClientProps>) => FeatureProviderProviderClient<UnSanitizedClientProps, ClientProps>;
//# sourceMappingURL=createClientFeature.d.ts.map