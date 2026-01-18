import React from 'react';
import './index.scss';
export declare const CodeField: React.FC<{
    readonly autoComplete?: string;
    readonly onMount?: import("@monaco-editor/react").EditorProps["onMount"];
    readonly path: string;
    readonly validate?: import("payload").CodeFieldValidation;
} & {
    readonly field: Omit<import("payload").CodeFieldClient, "type"> & Partial<Pick<import("payload").CodeFieldClient, "type">>;
} & Omit<import("payload").ClientComponentProps, "customComponents" | "field">>;
//# sourceMappingURL=index.d.ts.map