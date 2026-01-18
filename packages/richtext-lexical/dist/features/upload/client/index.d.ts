import type { ExclusiveUploadFeatureProps } from '../server/index.js';
export type UploadFeaturePropsClient = {
    collections: {
        [collection: string]: {
            hasExtraFields: boolean;
        };
    };
} & ExclusiveUploadFeatureProps;
export declare const UploadFeatureClient: import("../../typesClient.js").FeatureProviderProviderClient<UploadFeaturePropsClient, UploadFeaturePropsClient>;
//# sourceMappingURL=index.d.ts.map