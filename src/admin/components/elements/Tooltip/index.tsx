import React from 'react';
import { Props } from './types';

import './index.scss';

const Tooltip: React.FC<Props> = (props) => {
  const { className, children } = props;

  const classes = [
    'tooltip',
    className,
  ].filter(Boolean).join(' ');

  return (
    <aside className={classes}>
      {children}
      <span />
    </aside>
  );
};

export default Tooltip;
