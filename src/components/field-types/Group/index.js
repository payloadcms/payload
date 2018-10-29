import React from 'react';

import './index.css';

export default props => {
  const Heading = props.heading
    ? () => <header><h2>{props.heading}</h2></header>
    : () => null;

  return (
    <section className="field-group">
      <Heading />
      <div className="content">
        {props.children}
      </div>
    </section>
  );
};
