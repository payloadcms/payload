import React from 'react';
import type { LoadedSlateFieldProps } from '../types.js';
type LeafContextType = {
    attributes: Record<string, unknown>;
    children: React.ReactNode;
    editorRef: React.RefObject<HTMLDivElement>;
    fieldProps: LoadedSlateFieldProps;
    leaf: string;
    path: string;
    schemaPath: string;
};
export declare const LeafProvider: React.FC<{
    result: React.ReactNode;
} & LeafContextType>;
export declare const useLeaf: () => LeafContextType;
export {};
//# sourceMappingURL=LeafProvider.d.ts.map