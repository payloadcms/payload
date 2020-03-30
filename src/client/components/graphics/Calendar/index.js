import React from 'react';

import './index.scss';

const Calendar = () => {
  return (
    <svg
      className="icon calendar"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 94.5 93.5"
    >
      <line
        className="stroke"
        x1="0.25"
        y1="36.94"
        x2="94.25"
        y2="36.94"
      />
      <line
        className="stroke"
        x1="24.6"
        y1="22.34"
        x2="24.6"
      />
      <line
        className="stroke"
        x1="69.9"
        y1="22.34"
        x2="69.9"
      />
      <rect
        className="stroke"
        x="0.5"
        y="11.56"
        width="93.5"
        height="81.44"
      />
    </svg>
  );
};

export default Calendar;
