import React from 'react';
import './index.scss';
import type { Data, FileSizes, SanitizedCollectionConfig } from 'payload';
export type DraggableFileDetailsProps = {
    collectionSlug: string;
    customUploadActions?: React.ReactNode[];
    doc: {
        sizes?: FileSizes;
    } & Data;
    enableAdjustments?: boolean;
    hasImageSizes?: boolean;
    hasMany: boolean;
    hideRemoveFile?: boolean;
    imageCacheTag?: string;
    isSortable?: boolean;
    removeItem?: (index: number) => void;
    rowIndex: number;
    uploadConfig: SanitizedCollectionConfig['upload'];
};
export declare const DraggableFileDetails: React.FC<DraggableFileDetailsProps>;
//# sourceMappingURL=index.d.ts.map