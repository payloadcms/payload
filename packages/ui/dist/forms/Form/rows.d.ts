import type { FormState } from 'payload';
type Result = {
    remainingFields: FormState;
    rows: FormState[];
};
export declare const separateRows: (path: string, fields: FormState) => Result;
export declare const flattenRows: (path: string, rows: FormState[]) => FormState;
export {};
//# sourceMappingURL=rows.d.ts.map