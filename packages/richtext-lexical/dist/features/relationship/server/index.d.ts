import type { CollectionSlug } from 'payload';
export type ExclusiveRelationshipFeatureProps = {
    /**
     * The collections that should be disabled. Overrides the `enableRichTextRelationship` property in the collection config.
     * When this property is set, `enabledCollections` will not be available.
     **/
    disabledCollections?: CollectionSlug[];
    enabledCollections?: never;
} | {
    disabledCollections?: never;
    /**
     * The collections that should be enabled. Overrides the `enableRichTextRelationship` property in the collection config
     * When this property is set, `disabledCollections` will not be available.
     **/
    enabledCollections?: CollectionSlug[];
};
export type RelationshipFeatureProps = {
    /**
     * Sets a maximum population depth for this relationship, regardless of the remaining depth when the respective field is reached.
     * This behaves exactly like the maxDepth properties of relationship and upload fields.
     *
     * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
     */
    maxDepth?: number;
} & ExclusiveRelationshipFeatureProps;
export declare const RelationshipFeature: import("../../typesServer.js").FeatureProviderProviderServer<RelationshipFeatureProps, RelationshipFeatureProps, ExclusiveRelationshipFeatureProps>;
//# sourceMappingURL=index.d.ts.map