import React from 'react';
import Sidebar from '../Sidebar';
import StepNav from '../../modules/StepNav';

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
