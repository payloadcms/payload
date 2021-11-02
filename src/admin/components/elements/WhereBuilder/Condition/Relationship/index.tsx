import React from 'react';
import { Props } from './types';

import './index.scss';

const baseClass = 'condition-value-relationship';

const RelationshipField: React.FC<Props> = (props) => {
  const { onChange, value } = props;
  console.log(props);
  return (
    <input
      placeholder="Enter a value"
      className={baseClass}
      type="number"
      onChange={(e) => onChange(e.target.value)}
      value={value}
    />
  );
};

export default RelationshipField;
