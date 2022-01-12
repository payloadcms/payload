import React from 'react';

import './index.scss';

const Swap: React.FC = () => (
  <svg
    className="icon icon--swap"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 25 25"
  >
    <path
      d="M9.84631 4.78679L6.00004 8.63306L9.84631 12.4793"
      className="stroke"
    />
    <path
      d="M15.1537 20.1059L19 16.2596L15.1537 12.4133"
      className="stroke"
    />
    <line
      x1="7"
      y1="8.7013"
      x2="15"
      y2="8.7013"
      stroke="#333333"
      className="stroke"
    />
    <line
      x1="18"
      y1="16.1195"
      x2="10"
      y2="16.1195"
      className="stroke"
    />
  </svg>
);

export default Swap;
