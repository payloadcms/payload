import React from 'react';
import Sidebar from '../Sidebar';
import StepNav from '../../modules/StepNav';
import Localizer from '../../modules/Localizer';

import './index.scss';

const DefaultTemplate = ({ children }) => {
  return (
    <div className="default-template">
      <div className="wrap">
        <Sidebar />
        <div className="eyebrow">
          <StepNav />
          <Localizer />
        </div>
        {children}
      </div>
    </div>
  );
};

export default DefaultTemplate;
