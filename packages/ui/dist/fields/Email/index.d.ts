import type { EmailFieldValidation } from 'payload';
import React from 'react';
import './index.scss';
export declare const EmailField: React.FC<{
    readonly path: string;
    readonly validate?: EmailFieldValidation;
} & {
    readonly field: Omit<import("payload").EmailFieldClient, "type"> & Partial<Pick<import("payload").EmailFieldClient, "type">>;
} & Omit<import("payload").ClientComponentProps, "customComponents" | "field">>;
//# sourceMappingURL=index.d.ts.map