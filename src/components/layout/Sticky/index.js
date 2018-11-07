import React from 'react';

import './index.css';

const Sticky = props => {
  return (
    <div className="sticky">
      {props.children}
    </div>
  );
}

export default Sticky;
