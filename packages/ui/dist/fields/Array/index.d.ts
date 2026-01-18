import type { ArrayFieldClientComponent } from 'payload';
import React from 'react';
import './index.scss';
export declare const ArrayFieldComponent: ArrayFieldClientComponent;
export declare const ArrayField: React.FC<{
    readonly validate?: import("payload").ArrayFieldValidation;
} & import("payload").FieldPaths & {
    readonly field: Omit<import("payload").ArrayFieldClient, "type"> & Partial<Pick<import("payload").ArrayFieldClient, "type">>;
} & Omit<import("payload").ClientComponentProps, "customComponents" | "field">>;
//# sourceMappingURL=index.d.ts.map