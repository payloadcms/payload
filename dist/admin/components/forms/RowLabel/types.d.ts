import React from 'react';
import { Data } from '../Form/types';
export type Props = {
    path: string;
    label?: RowLabel;
    rowNumber?: number;
    className?: string;
};
export type RowLabelArgs = {
    data: Data;
    path: string;
    index?: number;
};
export type RowLabelFunction = (args: RowLabelArgs) => string;
export type RowLabelComponent = React.ComponentType<RowLabelArgs>;
export type RowLabel = string | Record<string, string> | RowLabelFunction | RowLabelComponent;
export declare function isComponent(label: RowLabel): label is RowLabelComponent;
