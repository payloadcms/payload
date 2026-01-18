import type { I18nClient } from '@payloadcms/translations';
import type { SanitizedCollectionConfig, SanitizedGlobalConfig, SanitizedPermissions, StaticLabel } from 'payload';
/**
 * @deprecated Import from `payload` instead
 */
export declare enum EntityType {
    collection = "collections",
    global = "globals"
}
export type EntityToGroup = {
    entity: SanitizedCollectionConfig;
    type: EntityType.collection;
} | {
    entity: SanitizedGlobalConfig;
    type: EntityType.global;
};
export type NavGroupType = {
    entities: {
        label: StaticLabel;
        slug: string;
        type: EntityType;
    }[];
    label: string;
};
export declare function groupNavItems(entities: EntityToGroup[], permissions: SanitizedPermissions, i18n: I18nClient): NavGroupType[];
//# sourceMappingURL=groupNavItems.d.ts.map