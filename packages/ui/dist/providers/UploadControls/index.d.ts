import React from 'react';
export type UploadControlsContext = {
    setUploadControlFile: (file: File) => void;
    setUploadControlFileName: (name: string) => void;
    setUploadControlFileUrl: (url: string) => void;
    uploadControlFile: File | null;
    uploadControlFileName: null | string;
    uploadControlFileUrl: string;
};
export declare const UploadControlsProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useUploadControls: () => UploadControlsContext;
//# sourceMappingURL=index.d.ts.map