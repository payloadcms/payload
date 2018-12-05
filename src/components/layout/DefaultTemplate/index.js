import React from 'react';
import { Sidebar, StepNav } from 'payload/components';

import './index.scss';

const DefaultTemplate = props => {
  return (
    <div className="default-template">
      <div className="wrap">
        <Sidebar icon={props.icon} collections={props.collections} />
        <StepNav />
        {props.children}
      </div>
    </div>
  );
};

export default DefaultTemplate;
