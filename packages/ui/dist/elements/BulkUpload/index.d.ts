import type { CollectionSlug, JsonObject } from 'payload';
import React from 'react';
import { type InitialForms } from './FormsManager/index.js';
export type BulkUploadProps = {
    readonly children: React.ReactNode;
};
export declare function BulkUploadDrawer(): React.JSX.Element;
export type BulkUploadContext = {
    collectionSlug: CollectionSlug;
    drawerSlug: string;
    initialFiles: FileList;
    /**
     * Like initialFiles, but allows manually providing initial form state or the form ID for each file
     */
    initialForms: InitialForms;
    maxFiles: number;
    onCancel: () => void;
    onSuccess: (uploadedForms: Array<{
        collectionSlug: CollectionSlug;
        doc: JsonObject;
        /**
         * ID of the form that created this document
         */
        formID: string;
    }>, errorCount: number) => void;
    /**
     * An array of collection slugs that can be selected in the collection dropdown (if applicable)
     * @default null - collection cannot be selected
     */
    selectableCollections?: null | string[];
    setCollectionSlug: (slug: string) => void;
    setInitialFiles: (files: FileList) => void;
    setInitialForms: (forms: ((forms: InitialForms | undefined) => InitialForms | undefined) | InitialForms) => void;
    setMaxFiles: (maxFiles: number) => void;
    setOnCancel: (onCancel: BulkUploadContext['onCancel']) => void;
    setOnSuccess: (onSuccess: BulkUploadContext['onSuccess']) => void;
    /**
     * Set the collections that can be selected in the collection dropdown (if applicable)
     *
     * @default null - collection cannot be selected
     */
    setSelectableCollections: (collections: null | string[]) => void;
    setSuccessfullyUploaded: (successfullyUploaded: boolean) => void;
    successfullyUploaded: boolean;
};
export declare function BulkUploadProvider({ children, drawerSlugPrefix, }: {
    readonly children: React.ReactNode;
    readonly drawerSlugPrefix?: string;
}): React.JSX.Element;
export declare const useBulkUpload: () => BulkUploadContext;
export declare function useBulkUploadDrawerSlug(): string;
//# sourceMappingURL=index.d.ts.map