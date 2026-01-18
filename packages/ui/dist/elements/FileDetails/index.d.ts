import type { Data, FileSizes, SanitizedCollectionConfig } from 'payload';
import React from 'react';
type SharedFileDetailsProps = {
    collectionSlug: string;
    customUploadActions?: React.ReactNode[];
    doc: {
        sizes?: FileSizes;
    } & Data;
    enableAdjustments?: boolean;
    hasImageSizes?: boolean;
    hideRemoveFile?: boolean;
    imageCacheTag?: string;
    uploadConfig: SanitizedCollectionConfig['upload'];
};
type StaticFileDetailsProps = {
    draggableItemProps?: never;
    handleRemove?: () => void;
    hasMany?: never;
    isSortable?: never;
    removeItem?: never;
    rowIndex?: never;
};
type DraggableFileDetailsProps = {
    handleRemove?: never;
    hasMany: boolean;
    isSortable?: boolean;
    removeItem?: (index: number) => void;
    rowIndex: number;
};
export type FileDetailsProps = (DraggableFileDetailsProps | StaticFileDetailsProps) & SharedFileDetailsProps;
export declare const FileDetails: React.FC<FileDetailsProps>;
export {};
//# sourceMappingURL=index.d.ts.map