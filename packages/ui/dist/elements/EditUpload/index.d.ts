import type { UploadEdits } from 'payload';
import React from 'react';
import 'react-image-crop/dist/ReactCrop.css';
import './index.scss';
type FocalPosition = {
    x: number;
    y: number;
};
export type EditUploadProps = {
    fileName: string;
    fileSrc: string;
    imageCacheTag?: string;
    initialCrop?: UploadEdits['crop'];
    initialFocalPoint?: FocalPosition;
    onSave?: (uploadEdits: UploadEdits) => void;
    showCrop?: boolean;
    showFocalPoint?: boolean;
};
export declare const EditUpload: React.FC<EditUploadProps>;
export {};
//# sourceMappingURL=index.d.ts.map