import type { ClientField } from '../../fields/config/types.js';
export type Column = {
    readonly accessor: string;
    readonly active: boolean;
    readonly CustomLabel?: React.ReactNode;
    readonly field: ClientField;
    readonly Heading: React.ReactNode;
    readonly renderedCells: React.ReactNode[];
};
//# sourceMappingURL=Table.d.ts.map