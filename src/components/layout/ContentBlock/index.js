import React from 'react';

import './index.css';

const ContentBlock = (props) => {
  let classes = props.className
    ? `content-block ${props.className}`
    : 'content-block';

  classes = props.width
    ? `${classes} ${props.width}`
    : classes;

  classes = props.align
    ? `${classes} align-${props.align}`
    : classes;

  return (
    <section className={classes} style={props.style}>
      {props.children}
    </section>
  );
};

export default ContentBlock;
