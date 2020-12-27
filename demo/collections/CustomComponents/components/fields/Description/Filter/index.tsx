import React from 'react';
import { Props } from './types';

import './index.scss';

const Filter: React.FC<Props> = ({ onChange, value }) => (
  <input
    className="custom-description-filter"
    type="text"
    onChange={(e) => onChange(e.target.value)}
    value={value}
  />
);

export default Filter;
