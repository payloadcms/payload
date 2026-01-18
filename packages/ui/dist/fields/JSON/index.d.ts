import React from 'react';
import './index.scss';
export declare const JSONField: React.FC<{
    readonly path: string;
    readonly validate?: import("payload").JSONFieldValidation;
} & {
    readonly field: Omit<import("payload").JSONFieldClient, "type"> & Partial<Pick<import("payload").JSONFieldClient, "type">>;
} & Omit<import("payload").ClientComponentProps, "customComponents" | "field">>;
//# sourceMappingURL=index.d.ts.map