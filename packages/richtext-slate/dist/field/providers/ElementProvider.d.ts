import type { Element } from 'slate';
import React from 'react';
import type { LoadedSlateFieldProps } from '../types.js';
type ElementContextType<T> = {
    attributes: Record<string, unknown>;
    children: React.ReactNode;
    editorRef: React.RefObject<HTMLDivElement>;
    element: T;
    fieldProps: LoadedSlateFieldProps;
    path: string;
    schemaPath: string;
};
export declare const ElementProvider: React.FC<{
    childNodes: React.ReactNode;
} & ElementContextType<Element>>;
export declare const useElement: <T>() => ElementContextType<T>;
export {};
//# sourceMappingURL=ElementProvider.d.ts.map