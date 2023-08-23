import React from 'react';

import './index.scss';

const CloseMenu: React.FC = () => (
  <svg
    className="icon icon--close-menu"
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="5.42896"
      y="18.1569"
      width="18"
      height="2"
      transform="rotate(-45 5.42896 18.1569)"
      className="fill"
    />
    <rect
      x="6.84314"
      y="5.42892"
      width="18"
      height="2"
      transform="rotate(45 6.84314 5.42892)"
      className="fill"
    />
  </svg>
);

export default CloseMenu;
