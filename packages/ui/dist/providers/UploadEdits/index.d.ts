import type { UploadEdits } from 'payload';
import React from 'react';
export type UploadEditsProviderProps = {
    children: React.ReactNode;
    initialUploadEdits?: UploadEdits;
};
export type UploadEditsContext = {
    getUploadEdits: () => UploadEdits;
    resetUploadEdits: () => void;
    updateUploadEdits: (edits: UploadEdits) => void;
    uploadEdits: UploadEdits;
};
export declare const UploadEditsProvider: ({ children, initialUploadEdits }: UploadEditsProviderProps) => React.JSX.Element;
export declare const useUploadEdits: () => UploadEditsContext;
//# sourceMappingURL=index.d.ts.map