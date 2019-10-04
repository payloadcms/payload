import React from 'react';
import { Sidebar, StepNav, Localizer } from 'payload/components';

import './index.scss';

const DefaultTemplate = props => {
  return (
    <div className="default-template">
      <div className="wrap">
        <Sidebar icon={props.icon} collections={props.collections} />
        <div className="eyebrow">
          <StepNav />
          <Localizer />
        </div>
        {props.children}
      </div>
    </div>
  );
};

export default DefaultTemplate;
