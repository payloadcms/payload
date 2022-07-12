import React from 'react';

import './index.scss';

const X: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="25"
    height="25"
    className={[
      className,
      'icon icon--x',
    ].filter(Boolean).join(' ')}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 25 25"
  >
    <line
      className="stroke"
      x1="8.74612"
      y1="16.347"
      x2="16.3973"
      y2="8.69584"
    />
    <line
      className="stroke"
      x1="8.6027"
      y1="8.69585"
      x2="16.2539"
      y2="16.3471"
    />
  </svg>
);

export default X;
