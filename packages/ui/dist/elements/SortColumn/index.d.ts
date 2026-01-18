import type { StaticLabel } from 'payload';
import React from 'react';
import './index.scss';
export type SortColumnProps = {
    readonly appearance?: 'condensed' | 'default';
    readonly disable?: boolean;
    readonly Label: React.ReactNode;
    readonly label?: StaticLabel;
    readonly name: string;
};
export declare const SortColumn: React.FC<SortColumnProps>;
//# sourceMappingURL=index.d.ts.map