import React from 'react';
import './index.scss';
import type { Data, FileSizes, SanitizedCollectionConfig } from 'payload';
export type StaticFileDetailsProps = {
    customUploadActions?: React.ReactNode[];
    doc: {
        sizes?: FileSizes;
    } & Data;
    enableAdjustments?: boolean;
    handleRemove?: () => void;
    hasImageSizes?: boolean;
    hideRemoveFile?: boolean;
    imageCacheTag?: string;
    uploadConfig: SanitizedCollectionConfig['upload'];
};
export declare const StaticFileDetails: React.FC<StaticFileDetailsProps>;
//# sourceMappingURL=index.d.ts.map