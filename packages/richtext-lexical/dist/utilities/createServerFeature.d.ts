import type { SanitizedConfig } from 'payload';
import type { FeatureProviderProviderServer, FeatureProviderServer, ResolvedServerFeatureMap, ServerFeature, ServerFeatureProviderMap } from '../features/typesServer.js';
import type { ServerEditorConfig } from '../lexical/config/types.js';
export type CreateServerFeatureArgs<UnSanitizedProps, SanitizedProps, ClientProps> = {
    feature: ((props: {
        config: SanitizedConfig;
        /** unSanitizedEditorConfig.features, but mapped */
        featureProviderMap: ServerFeatureProviderMap;
        isRoot?: boolean;
        parentIsLocalized: boolean;
        props: UnSanitizedProps;
        resolvedFeatures: ResolvedServerFeatureMap;
        unSanitizedEditorConfig: ServerEditorConfig;
    }) => Promise<ServerFeature<SanitizedProps, ClientProps>> | ServerFeature<SanitizedProps, ClientProps>) | Omit<ServerFeature<SanitizedProps, ClientProps>, 'sanitizedServerFeatureProps'>;
} & Pick<FeatureProviderServer<UnSanitizedProps, ClientProps>, 'dependencies' | 'dependenciesPriority' | 'dependenciesSoft' | 'key'>;
export declare const createServerFeature: <UnSanitizedProps = undefined, SanitizedProps = UnSanitizedProps, ClientProps = undefined>(args: CreateServerFeatureArgs<UnSanitizedProps, SanitizedProps, ClientProps>) => FeatureProviderProviderServer<UnSanitizedProps, SanitizedProps, ClientProps>;
//# sourceMappingURL=createServerFeature.d.ts.map