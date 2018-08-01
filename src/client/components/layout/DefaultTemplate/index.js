import React from 'react';
import Sidebar from '../Sidebar';
import StepNav from '../StepNav';

import './index.css';

export default props => {
  return (
    <div className="default-template">
      <Sidebar />
      <StepNav />
      {props.children}
    </div>
  );
};
