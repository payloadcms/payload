import React from 'react';
import './index.scss';
export declare const NumberField: React.FC<{
    readonly onChange?: (e: number) => void;
    readonly path: string;
    readonly validate?: import("payload").NumberFieldValidation;
} & {
    readonly field: Omit<import("payload").NumberFieldClient, "type"> & Partial<Pick<import("payload").NumberFieldClient, "type">>;
} & Omit<import("payload").ClientComponentProps, "customComponents" | "field">>;
//# sourceMappingURL=index.d.ts.map