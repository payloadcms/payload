import type { PointFieldClientComponent, PointFieldValidation } from 'payload';
import React from 'react';
import './index.scss';
export declare const PointFieldComponent: PointFieldClientComponent;
export declare const PointField: React.FC<{
    readonly path: string;
    readonly validate?: PointFieldValidation;
} & {
    readonly field: Omit<import("payload").PointFieldClient, "type"> & Partial<Pick<import("payload").PointFieldClient, "type">>;
} & Omit<import("payload").ClientComponentProps, "customComponents" | "field">>;
//# sourceMappingURL=index.d.ts.map