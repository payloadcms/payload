import type { AdminViewServerProps, CollectionPreferences, CollectionSlug, CustomComponent, DocumentSubViewTypes, Payload, PayloadComponent, SanitizedCollectionConfig, SanitizedGlobalConfig, ViewTypes } from 'payload';
import type React from 'react';
export type ViewFromConfig = {
    Component?: React.FC<AdminViewServerProps>;
    payloadComponent?: PayloadComponent<AdminViewServerProps>;
};
type GetRouteDataResult = {
    browseByFolderSlugs: CollectionSlug[];
    collectionConfig?: SanitizedCollectionConfig;
    DefaultView: ViewFromConfig;
    documentSubViewType?: DocumentSubViewTypes;
    globalConfig?: SanitizedGlobalConfig;
    routeParams: {
        collection?: string;
        folderCollection?: string;
        folderID?: number | string;
        global?: string;
        id?: number | string;
        token?: string;
        versionID?: number | string;
    };
    templateClassName: string;
    templateType: 'default' | 'minimal';
    viewActions?: CustomComponent[];
    viewType?: ViewTypes;
};
type GetRouteDataArgs = {
    adminRoute: string;
    collectionConfig?: SanitizedCollectionConfig;
    /**
     * User preferences for a collection.
     *
     * These preferences are normally undefined
     * unless the user is on the list view and the
     * collection is folder enabled.
     */
    collectionPreferences?: CollectionPreferences;
    currentRoute: string;
    globalConfig?: SanitizedGlobalConfig;
    payload: Payload;
    searchParams: {
        [key: string]: string | string[];
    };
    segments: string[];
};
export declare const getRouteData: ({ adminRoute, collectionConfig, collectionPreferences, currentRoute, globalConfig, payload, segments, }: GetRouteDataArgs) => GetRouteDataResult;
export {};
//# sourceMappingURL=getRouteData.d.ts.map