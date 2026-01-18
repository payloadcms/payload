import type { CollectionPreferences, FilterOptionsResult, ListQuery, SanitizedCollectionConfig } from 'payload';
import type React from 'react';
import type { HTMLAttributes } from 'react';
import type { ListDrawerContextProps } from './Provider.js';
/**
 * @internal - this may change in a minor release
 */
export type RenderListServerFnArgs = {
    collectionSlug: string;
    disableActions?: boolean;
    disableBulkDelete?: boolean;
    disableBulkEdit?: boolean;
    disableQueryPresets?: boolean;
    drawerSlug?: string;
    enableRowSelections: boolean;
    overrideEntityVisibility?: boolean;
    query: ListQuery;
    redirectAfterDelete?: boolean;
    redirectAfterDuplicate?: boolean;
};
/**
 * @internal - this may change in a minor release
 */
export type RenderListServerFnReturnType = {
    List: React.ReactNode;
    preferences: CollectionPreferences;
};
export type ListDrawerProps = {
    readonly allowCreate?: boolean;
    readonly collectionSlugs: SanitizedCollectionConfig['slug'][];
    readonly disableQueryPresets?: boolean;
    readonly drawerSlug?: string;
    readonly enableRowSelections?: boolean;
    readonly filterOptions?: FilterOptionsResult;
    readonly overrideEntityVisibility?: boolean;
    readonly selectedCollection?: string;
} & ListDrawerContextProps;
export type ListTogglerProps = {
    children?: React.ReactNode;
    className?: string;
    disabled?: boolean;
    drawerSlug?: string;
} & HTMLAttributes<HTMLButtonElement>;
export type UseListDrawer = (args: {
    collectionSlugs?: SanitizedCollectionConfig['slug'][];
    filterOptions?: FilterOptionsResult;
    overrideEntityVisibility?: boolean;
    selectedCollection?: SanitizedCollectionConfig['slug'];
    uploads?: boolean;
}) => [
    React.FC<Omit<ListDrawerProps, 'collectionSlugs'>>,
    React.FC<Omit<ListTogglerProps, 'drawerSlug'>>,
    {
        closeDrawer: () => void;
        collectionSlugs: SanitizedCollectionConfig['slug'][];
        drawerDepth: number;
        drawerSlug: string;
        isDrawerOpen: boolean;
        openDrawer: () => void;
        setCollectionSlugs: React.Dispatch<React.SetStateAction<SanitizedCollectionConfig['slug'][]>>;
        toggleDrawer: () => void;
    }
];
//# sourceMappingURL=types.d.ts.map