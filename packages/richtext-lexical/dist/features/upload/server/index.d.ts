import type { Field, UploadCollectionSlug } from 'payload';
import type { UploadFeaturePropsClient } from '../client/index.js';
export type ExclusiveUploadFeatureProps = {
    /**
     * The collections that should be disabled. Overrides the `enableRichTextRelationship` property in the collection config.
     * When this property is set, `enabledCollections` will not be available.
     **/
    disabledCollections?: UploadCollectionSlug[];
    enabledCollections?: never;
} | {
    disabledCollections?: never;
    /**
     * The collections that should be enabled. Overrides the `enableRichTextRelationship` property in the collection config
     * When this property is set, `disabledCollections` will not be available.
     **/
    enabledCollections?: UploadCollectionSlug[];
};
export type UploadFeatureProps = {
    collections?: {
        [collection: UploadCollectionSlug]: {
            fields: Field[];
        };
    };
    /**
     * Sets a maximum population depth for this upload (not the fields for this upload), regardless of the remaining depth when the respective field is reached.
     * This behaves exactly like the maxDepth properties of relationship and upload fields.
     *
     * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
     */
    maxDepth?: number;
} & ExclusiveUploadFeatureProps;
export declare const UploadFeature: import("../../typesServer.js").FeatureProviderProviderServer<UploadFeatureProps, UploadFeatureProps, UploadFeaturePropsClient>;
//# sourceMappingURL=index.d.ts.map