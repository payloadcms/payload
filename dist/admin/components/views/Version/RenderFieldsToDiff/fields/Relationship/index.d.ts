import React from 'react';
import { RelationshipField } from '../../../../../../../fields/config/types';
import { Props } from '../types';
import './index.scss';
declare const Relationship: React.FC<Props & {
    field: RelationshipField;
}>;
export default Relationship;
