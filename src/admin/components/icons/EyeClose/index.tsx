import React from 'react';

import './index.scss';

const EyeClose: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    className="icon icon--eye-close"
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />
      <path d="M16.681 16.673A8.717 8.717 0 0 1 12 18c-3.6 0-6.6-2-9-6c1.272-2.12 2.712-3.678 4.32-4.674m2.86-1.146A9.055 9.055 0 0 1 12 6c3.6 0 6.6 2 9 6c-.666 1.11-1.379 2.067-2.138 2.87M3 3l18 18" />
    </g>
  </svg>
);

export default EyeClose;
