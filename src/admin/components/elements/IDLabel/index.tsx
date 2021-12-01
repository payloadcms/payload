import React from 'react';

import './index.scss';

const baseClass = 'id-label';

const IDLabel: React.FC<{ id: string }> = ({ id }) => (
  <div className={baseClass}>
    ID:&nbsp;&nbsp;
    {id}
  </div>
);

export default IDLabel;
