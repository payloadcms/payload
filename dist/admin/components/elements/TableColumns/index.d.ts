import React from 'react';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { Column } from '../Table/types';
import { Action } from './columnReducer';
import { Props as CellProps } from '../../views/collections/List/Cell/types';
export interface ITableColumns {
    columns: Column[];
    dispatchTableColumns: React.Dispatch<Action>;
    setActiveColumns: (columns: string[]) => void;
    moveColumn: (args: {
        fromIndex: number;
        toIndex: number;
    }) => void;
    toggleColumn: (column: string) => void;
}
export declare const TableColumnContext: React.Context<ITableColumns>;
export declare const useTableColumns: () => ITableColumns;
export declare const TableColumnsProvider: React.FC<{
    children: React.ReactNode;
    collection: SanitizedCollectionConfig;
    cellProps?: Partial<CellProps>[];
}>;
