import type { ClientCollectionConfig, Column } from 'payload';
import './index.scss';
import React from 'react';
export type Props = {
    readonly appearance?: 'condensed' | 'default';
    readonly BeforeTable?: React.ReactNode;
    readonly collection: ClientCollectionConfig;
    readonly columns?: Column[];
    readonly data: Record<string, unknown>[];
    readonly heading?: React.ReactNode;
};
export declare const OrderableTable: React.FC<Props>;
//# sourceMappingURL=OrderableTable.d.ts.map