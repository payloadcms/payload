import React from 'react';

import './index.scss';

const Tooltip = (props) => {
  let className = props.className ? `tooltip ${props.className}` : 'tooltip';

  return (
    <aside className={className}>
      {props.children}
      <span></span>
    </aside>
  );
};

export default Tooltip;
