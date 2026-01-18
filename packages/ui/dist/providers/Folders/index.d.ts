import type { ClientCollectionConfig, CollectionSlug, FolderSortKeys } from 'payload';
import type { FolderBreadcrumb, FolderDocumentItemKey, FolderOrDocument } from 'payload/shared';
import React from 'react';
type FolderQueryParams = {
    page?: string;
    relationTo?: CollectionSlug[];
    search?: string;
    sort?: string;
};
export type FileCardData = {
    filename: string;
    id: number | string;
    mimeType: string;
    name: string;
    url: string;
};
export type FolderContextValue = {
    /**
     * The collection slugs that a view can be filtered by
     * Used in the browse-by-folder view
     */
    activeCollectionFolderSlugs: CollectionSlug[];
    /**
     * Folder enabled collection slugs that can be populated within the provider
     */
    readonly allCollectionFolderSlugs?: CollectionSlug[];
    allowCreateCollectionSlugs: CollectionSlug[];
    breadcrumbs?: FolderBreadcrumb[];
    checkIfItemIsDisabled: (item: FolderOrDocument) => boolean;
    clearSelections: () => void;
    currentFolder?: FolderOrDocument | null;
    documents?: FolderOrDocument[];
    dragOverlayItem?: FolderOrDocument | undefined;
    focusedRowIndex: number;
    folderCollectionConfig: ClientCollectionConfig;
    folderCollectionSlug: string;
    folderFieldName: string;
    folderID?: number | string;
    FolderResultsComponent: React.ReactNode;
    folderType: CollectionSlug[] | undefined;
    getFolderRoute: (toFolderID?: number | string) => string;
    getSelectedItems?: () => FolderOrDocument[];
    isDragging: boolean;
    itemKeysToMove?: Set<FolderDocumentItemKey>;
    moveToFolder: (args: {
        itemsToMove: FolderOrDocument[];
        toFolderID?: number | string;
    }) => Promise<void>;
    onItemClick: (args: {
        event: React.MouseEvent;
        index: number;
        item: FolderOrDocument;
    }) => void;
    onItemKeyPress: (args: {
        event: React.KeyboardEvent;
        index: number;
        item: FolderOrDocument;
    }) => void;
    refineFolderData: (args: {
        query?: FolderQueryParams;
        updateURL: boolean;
    }) => void;
    search: string;
    selectedFolderCollections?: CollectionSlug[];
    readonly selectedItemKeys: Set<FolderDocumentItemKey>;
    setBreadcrumbs: React.Dispatch<React.SetStateAction<FolderBreadcrumb[]>>;
    setFocusedRowIndex: React.Dispatch<React.SetStateAction<number>>;
    setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
    sort: FolderSortKeys;
    subfolders?: FolderOrDocument[];
};
export type FolderProviderProps = {
    /**
     * The collection slugs that are being viewed
     */
    readonly activeCollectionFolderSlugs?: CollectionSlug[];
    /**
     * Folder enabled collection slugs that can be populated within the provider
     */
    readonly allCollectionFolderSlugs: CollectionSlug[];
    /**
     * Array of slugs that can be created in the folder view
     */
    readonly allowCreateCollectionSlugs: CollectionSlug[];
    readonly allowMultiSelection?: boolean;
    /**
     * The base folder route path
     *
     * @example
     * `/collections/:collectionSlug/:folderCollectionSlug`
     * or
     * `/browse-by-folder`
     */
    readonly baseFolderPath?: `/${string}`;
    /**
     * Breadcrumbs for the current folder
     */
    readonly breadcrumbs?: FolderBreadcrumb[];
    /**
     * Children to render inside the provider
     */
    readonly children: React.ReactNode;
    /**
     * All documents in the current folder
     */
    readonly documents: FolderOrDocument[];
    /**
     * The name of the field that contains the folder relation
     */
    readonly folderFieldName: string;
    /**
     * The ID of the current folder
     */
    readonly folderID?: number | string;
    /**
     * The component to render the folder results
     */
    readonly FolderResultsComponent: React.ReactNode;
    /**
     * Optional function to call when an item is clicked
     */
    readonly onItemClick?: (itme: FolderOrDocument) => void;
    /**
     * The intial search query
     */
    readonly search?: string;
    /**
     * The sort order of the documents
     *
     * @example
     * `name` for descending
     * `-name` for ascending
     */
    readonly sort?: FolderSortKeys;
    /**
     * All subfolders in the current folder
     */
    readonly subfolders: FolderOrDocument[];
};
export declare function FolderProvider({ activeCollectionFolderSlugs: activeCollectionSlugs, allCollectionFolderSlugs, allowCreateCollectionSlugs, allowMultiSelection, baseFolderPath, breadcrumbs: _breadcrumbsFromProps, children, documents, folderFieldName, folderID, FolderResultsComponent: InitialFolderResultsComponent, onItemClick: onItemClickFromProps, search, sort, subfolders, }: FolderProviderProps): React.JSX.Element;
export declare function useFolder(): FolderContextValue;
export {};
//# sourceMappingURL=index.d.ts.map