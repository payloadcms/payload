import type { Data, FileSize, SanitizedCollectionConfig } from 'payload';
import React from 'react';
import './index.scss';
type FileInfo = {
    url: string;
} & FileSize;
type FilesSizesWithUrl = {
    [key: string]: FileInfo;
};
export type PreviewSizesProps = {
    doc: {
        sizes?: FilesSizesWithUrl;
    } & Data;
    imageCacheTag?: string;
    uploadConfig: SanitizedCollectionConfig['upload'];
};
export declare const PreviewSizes: React.FC<PreviewSizesProps>;
export {};
//# sourceMappingURL=index.d.ts.map