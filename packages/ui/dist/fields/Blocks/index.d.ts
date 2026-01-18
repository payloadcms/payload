import React from 'react';
import './index.scss';
export declare const BlocksField: React.FC<{
    readonly validate?: import("payload").BlocksFieldValidation;
} & import("payload").FieldPaths & {
    readonly field: Omit<import("payload").BlocksFieldClient, "type"> & Partial<Pick<import("payload").BlocksFieldClient, "type">>;
} & Omit<import("payload").ClientComponentProps, "customComponents" | "field">>;
//# sourceMappingURL=index.d.ts.map