import React from 'react';

import './index.css';

export default props => {
  let classes = props.className ? props.className : undefined;

  return (
    <label className={classes}>
      {props.children}
    </label>
  );
};
