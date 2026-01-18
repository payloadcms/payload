import type { ClientField } from 'payload';
import React from 'react';
import './index.scss';
type Props = {
    hideGutter?: boolean;
    initCollapsed?: boolean;
    Label: React.ReactNode;
    locales: string[] | undefined;
    parentIsLocalized: boolean;
    valueTo: unknown;
} & ({
    children: React.ReactNode;
    field?: never;
    fields: ClientField[];
    isIterable?: false;
    valueFrom: unknown;
} | {
    children: React.ReactNode;
    field: ClientField;
    fields?: never;
    isIterable: true;
    valueFrom?: unknown;
});
export declare const DiffCollapser: React.FC<Props>;
export {};
//# sourceMappingURL=index.d.ts.map