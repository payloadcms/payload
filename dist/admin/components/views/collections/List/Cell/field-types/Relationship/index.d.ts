import React from 'react';
import { Props as DefaultCellProps } from '../../types';
import './index.scss';
declare const RelationshipCell: React.FC<{
    field: DefaultCellProps['field'];
    data: DefaultCellProps['cellData'];
}>;
export default RelationshipCell;
