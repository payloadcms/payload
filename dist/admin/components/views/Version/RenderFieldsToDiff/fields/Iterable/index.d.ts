import React from 'react';
import { Props } from '../types';
import { ArrayField, BlockField } from '../../../../../../../fields/config/types';
import './index.scss';
declare const Iterable: React.FC<Props & {
    field: ArrayField | BlockField;
}>;
export default Iterable;
