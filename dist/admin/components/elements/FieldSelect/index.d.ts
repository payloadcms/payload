import React from 'react';
import { Field, FieldWithPath } from '../../../../fields/config/types';
import './index.scss';
type Props = {
    fields: Field[];
    setSelected: (fields: FieldWithPath[]) => void;
};
export declare const FieldSelect: React.FC<Props>;
export {};
