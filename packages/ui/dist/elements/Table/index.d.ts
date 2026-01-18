import type { Column } from 'payload';
import React from 'react';
import './index.scss';
export type Props = {
    readonly appearance?: 'condensed' | 'default';
    readonly BeforeTable?: React.ReactNode;
    readonly columns?: Column[];
    readonly data: Record<string, unknown>[];
};
export declare const Table: React.FC<Props>;
//# sourceMappingURL=index.d.ts.map