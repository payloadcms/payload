import './index.scss';
import React from 'react';
export declare const baseClass = "version-drawer";
export declare const formatVersionDrawerSlug: ({ depth, uuid, }: {
    depth: number;
    uuid: string;
}) => string;
export declare const VersionDrawerContent: React.FC<{
    collectionSlug?: string;
    docID?: number | string;
    drawerSlug: string;
    globalSlug?: string;
}>;
export declare const VersionDrawer: React.FC<{
    collectionSlug?: string;
    docID?: number | string;
    drawerSlug: string;
    globalSlug?: string;
}>;
export declare const useVersionDrawer: ({ collectionSlug, docID, globalSlug, }: {
    collectionSlug?: string;
    docID?: number | string;
    globalSlug?: string;
}) => {
    closeDrawer: () => void;
    Drawer: () => React.JSX.Element;
    drawerDepth: number;
    drawerSlug: string;
    isDrawerOpen: boolean;
    openDrawer: () => void;
    toggleDrawer: () => void;
};
//# sourceMappingURL=index.d.ts.map