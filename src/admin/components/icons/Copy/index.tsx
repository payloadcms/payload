import React from 'react';

import './index.scss';

const Copy: React.FC = () => (
  <svg
    className="icon icon--copy"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 25 25"
  >
    <rect
      x="6.5"
      y="10"
      width="8"
      height="8"
      className="stroke"
    />
    <path
      d="M10 9.98438V6.5H18V14.5H14"
      className="stroke"
    />
  </svg>
);

export default Copy;
