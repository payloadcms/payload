import React from 'react';
import './index.scss';
type TableProps = {
    readonly appearance?: 'condensed' | 'default';
    readonly className?: string;
    readonly headerCells: React.ReactNode[];
    readonly tableRows: React.ReactNode[];
};
export declare const SimpleTable: ({ appearance, className, headerCells: headers, tableRows: rows, }: TableProps) => React.JSX.Element;
export declare const TableHead: ({ children, className, ...rest }: React.HTMLAttributes<HTMLTableSectionElement>) => React.JSX.Element;
export declare const TableBody: ({ children, className, ...rest }: React.HTMLAttributes<HTMLTableSectionElement>) => React.JSX.Element;
export declare const TableRow: ({ children, className, ...rest }: React.HTMLAttributes<HTMLTableRowElement>) => React.JSX.Element;
export declare const TableCell: ({ children, className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) => React.JSX.Element;
export declare const TableHeader: ({ children, className, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) => React.JSX.Element;
export declare const HiddenCell: ({ children, className, ...rest }: {
    children?: React.ReactNode;
} & React.TdHTMLAttributes<HTMLTableCellElement>) => React.JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map