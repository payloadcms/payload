import type { FormState, SanitizedCollectionConfig, UploadEdits } from 'payload';
import React from 'react';
import './index.scss';
export declare const editDrawerSlug = "edit-upload";
export declare const sizePreviewSlug = "preview-sizes";
type UploadActionsArgs = {
    readonly customActions?: React.ReactNode[];
    readonly enableAdjustments: boolean;
    readonly enablePreviewSizes: boolean;
    readonly mimeType: string;
};
export declare const UploadActions: ({ customActions, enableAdjustments, enablePreviewSizes, mimeType, }: UploadActionsArgs) => React.JSX.Element;
export type UploadProps = {
    readonly collectionSlug: string;
    readonly customActions?: React.ReactNode[];
    readonly initialState?: FormState;
    readonly onChange?: (file?: File) => void;
    readonly uploadConfig: SanitizedCollectionConfig['upload'];
    readonly UploadControls?: React.ReactNode;
};
export declare const Upload: React.FC<UploadProps>;
export type UploadProps_v4 = {
    readonly resetUploadEdits?: () => void;
    readonly updateUploadEdits?: (args: UploadEdits) => void;
    readonly uploadEdits?: UploadEdits;
} & UploadProps;
export declare const Upload_v4: React.FC<UploadProps_v4>;
export {};
//# sourceMappingURL=index.d.ts.map