import type { CollectionSlug, Field, FieldAffectingData, SanitizedConfig } from 'payload';
import type { ClientProps } from '../client/index.js';
export type ExclusiveLinkCollectionsProps = {
    /**
     * The collections that should be disabled for internal linking. Overrides the `enableRichTextLink` property in the collection config.
     * When this property is set, `enabledCollections` will not be available.
     **/
    disabledCollections?: CollectionSlug[];
    enabledCollections?: never;
} | {
    disabledCollections?: never;
    /**
     * The collections that should be enabled for internal linking. Overrides the `enableRichTextLink` property in the collection config
     * When this property is set, `disabledCollections` will not be available.
     **/
    enabledCollections?: CollectionSlug[];
};
export type LinkFeatureServerProps = {
    /**
     * Disables the automatic creation of links from URLs pasted into the editor, as well
     * as auto link nodes.
     *
     * If set to 'creationOnly', only the creation of new auto link nodes will be disabled.
     * Existing auto link nodes will still be editable.
     *
     * @default false
     */
    disableAutoLinks?: 'creationOnly' | true;
    /**
     * A function or array defining additional fields for the link feature. These will be
     * displayed in the link editor drawer.
     */
    fields?: ((args: {
        config: SanitizedConfig;
        defaultFields: FieldAffectingData[];
    }) => (Field | FieldAffectingData)[]) | Field[];
    /**
     * Sets a maximum population depth for the internal doc default field of link, regardless of the remaining depth when the field is reached.
     * This behaves exactly like the maxDepth properties of relationship and upload fields.
     *
     * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
     */
    maxDepth?: number;
} & ExclusiveLinkCollectionsProps;
export declare const LinkFeature: import("../../typesServer.js").FeatureProviderProviderServer<LinkFeatureServerProps, LinkFeatureServerProps, ClientProps>;
//# sourceMappingURL=index.d.ts.map