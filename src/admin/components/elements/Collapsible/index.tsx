import React from 'react';
import { Props } from './types';

import './index.scss';

const baseClass = 'collapsible';

export const Collapsible: React.FC<Props> = ({ children }) => {
  return (
    <div className={baseClass}>
      {children}
    </div>
  );
};
