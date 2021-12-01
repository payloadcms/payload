import React from 'react';

import './index.scss';

const baseClass = 'id-label';

const IDLabel: React.FC<{ id: string, prefix?: string }> = ({ id, prefix = 'ID:' }) => (
  <div className={baseClass}>
    {prefix}
    &nbsp;&nbsp;
    {id}
  </div>
);

export default IDLabel;
