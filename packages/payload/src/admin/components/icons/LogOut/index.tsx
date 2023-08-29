import React from 'react';

import './index.scss';

const LogOut: React.FC = () => (
  <svg
    className="icon icon--logout"
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 5H18V19H10"
      className="stroke"
    />
    <g>
      <path
        d="M8 8.5L4.46447 12.0355L8 15.5711"
        className="stroke"
      />
      <line
        x1="5"
        y1="12"
        x2="13"
        y2="12"
        className="stroke"
      />
    </g>
  </svg>
);

export default LogOut;
