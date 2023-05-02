import React, { HTMLAttributes } from 'react';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
export type DocumentDrawerProps = {
    collectionSlug: string;
    id?: string;
    onSave?: (json: {
        doc: Record<string, any>;
        message: string;
        collectionConfig: SanitizedCollectionConfig;
    }) => void;
    customHeader?: React.ReactNode;
    drawerSlug?: string;
};
export type DocumentTogglerProps = HTMLAttributes<HTMLButtonElement> & {
    children?: React.ReactNode;
    className?: string;
    drawerSlug?: string;
    id?: string;
    collectionSlug: string;
    disabled?: boolean;
};
export type UseDocumentDrawer = (args: {
    id?: string;
    collectionSlug: string;
}) => [
    React.FC<Omit<DocumentDrawerProps, 'collectionSlug' | 'id'>>,
    React.FC<Omit<DocumentTogglerProps, 'collectionSlug' | 'id'>>,
    {
        drawerSlug: string;
        drawerDepth: number;
        isDrawerOpen: boolean;
        toggleDrawer: () => void;
        closeDrawer: () => void;
        openDrawer: () => void;
    }
];
