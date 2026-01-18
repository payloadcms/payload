import type { DateFieldValidation } from 'payload';
import './index.scss';
export declare const DateTimeField: import("react").FC<{
    readonly path: string;
    readonly validate?: DateFieldValidation;
} & {
    readonly field: Omit<import("payload").DateFieldClient, "type"> & Partial<Pick<import("payload").DateFieldClient, "type">>;
} & Omit<import("payload").ClientComponentProps, "customComponents" | "field">>;
//# sourceMappingURL=index.d.ts.map