import React from 'react';
import Sidebar from '../Sidebar';
import StepNav from '../../modules/StepNav';
import Localizer from '../../modules/Localizer';

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
