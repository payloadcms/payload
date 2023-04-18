import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { Column } from '../Table/types';
import { Props as CellProps } from '../../views/collections/List/Cell/types';
type TOGGLE = {
    type: 'toggle';
    payload: {
        column: string;
        collection: SanitizedCollectionConfig;
        cellProps: Partial<CellProps>[];
    };
};
type SET = {
    type: 'set';
    payload: {
        columns: Pick<Column, 'accessor' | 'active'>[];
        collection: SanitizedCollectionConfig;
        cellProps: Partial<CellProps>[];
    };
};
type MOVE = {
    type: 'move';
    payload: {
        fromIndex: number;
        toIndex: number;
        collection: SanitizedCollectionConfig;
        cellProps: Partial<CellProps>[];
    };
};
export type Action = TOGGLE | SET | MOVE;
export declare const columnReducer: (state: Column[], action: Action) => Column[];
export {};
