import React from 'react';
import { Where } from '../../../../../../types';
export declare enum SelectAllStatus {
    AllAvailable = "allAvailable",
    AllInPage = "allInPage",
    Some = "some",
    None = "none"
}
type SelectionContext = {
    selected: Record<string | number, boolean>;
    setSelection: (id: string | number) => void;
    selectAll: SelectAllStatus;
    toggleAll: (allAvailable?: boolean) => void;
    totalDocs: number;
    count: number;
    getQueryParams: (additionalParams?: Where) => string;
};
type Props = {
    children: React.ReactNode;
    docs: any[];
    totalDocs: number;
};
export declare const SelectionProvider: React.FC<Props>;
export declare const useSelection: () => SelectionContext;
export {};
