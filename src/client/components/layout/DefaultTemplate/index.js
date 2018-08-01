import React from 'react';
import Sidebar from '../Sidebar';

import './index.css';

export default props => {
  return (
    <div className="default-template">
      <Sidebar />
      {props.children}
    </div>
  );
}
