import React from 'react';

import './index.scss';

const Tooltip = (props) => {
  const className = props.className ? `tooltip ${props.className}` : 'tooltip';

  return (
    <aside className={className}>
      {props.children}
      <span />
    </aside>
  );
};

export default Tooltip;
