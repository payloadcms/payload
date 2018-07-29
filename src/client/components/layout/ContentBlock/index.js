import React from 'react';

import './index.css';

export default (props) => {
  let classes = props.className
    ? `content-block ${props.className}`
    : 'content-block';

  classes = props.width
    ? `${classes} ${props.width}`
    : classes;

  return (
    <section className={classes}>
      {props.children}
    </section>
  );
};
