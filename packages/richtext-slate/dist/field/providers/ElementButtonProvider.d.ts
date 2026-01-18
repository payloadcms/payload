import React from 'react';
import type { LoadedSlateFieldProps } from '../types.js';
type ElementButtonContextType = {
    disabled?: boolean;
    fieldProps: LoadedSlateFieldProps;
    path: string;
    schemaPath: string;
};
export declare const ElementButtonProvider: React.FC<{
    children: React.ReactNode;
} & ElementButtonContextType>;
export declare const useElementButton: () => ElementButtonContextType;
export {};
//# sourceMappingURL=ElementButtonProvider.d.ts.map