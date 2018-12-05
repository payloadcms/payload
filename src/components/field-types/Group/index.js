import React from 'react';

import './index.scss';

const Group = props => {
  return (
    <section className="field-group">
      {props.heading &&
        <header>
          <h2>{props.heading}</h2>
        </header>
      }
      <div className="content">
        {props.children}
      </div>
    </section>
  );
};

export default Group;
