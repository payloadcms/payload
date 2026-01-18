import React from 'react';
import type { LoadedSlateFieldProps } from '../types.js';
type LeafButtonContextType = {
    fieldProps: LoadedSlateFieldProps;
    path: string;
    schemaPath: string;
};
export declare const LeafButtonProvider: React.FC<{
    children: React.ReactNode;
} & LeafButtonContextType>;
export declare const useLeafButton: () => LeafButtonContextType;
export {};
//# sourceMappingURL=LeafButtonProvider.d.ts.map