import React from 'react';
type RowLabelType<T = unknown> = {
    readonly data: T;
    readonly path: string;
    readonly rowNumber?: number;
};
type Props<T> = {
    readonly children: React.ReactNode;
} & Omit<RowLabelType<T>, 'data'>;
export declare const RowLabelProvider: React.FC<Props<unknown>>;
export declare const useRowLabel: <T>() => RowLabelType<T>;
export {};
//# sourceMappingURL=index.d.ts.map