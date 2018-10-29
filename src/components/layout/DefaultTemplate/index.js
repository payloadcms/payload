import React from 'react';
import { Sidebar, StepNav } from 'payload/components';

import './index.css';

export default props => {
  return (
    <div className="default-template">
      <div className="wrap">
        <Sidebar />
        <StepNav />
        {props.children}
      </div>
    </div>
  );
};
