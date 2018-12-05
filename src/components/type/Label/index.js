import React from 'react';

import './index.scss';

const Label = props => {
  let classes = props.className ? props.className : undefined;

  return (
    <label className={classes}>
      {props.children}
    </label>
  );
};

export default Label;
