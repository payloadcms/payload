import React from 'react';

import './index.scss';

const Calendar: React.FC = () => (
  <svg
    className="icon icon--calendar"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 25 25"
  >
    <rect
      x="4.5"
      y="6.11401"
      width="16"
      height="14"
      className="stroke"
    />
    <line
      x1="8.625"
      y1="8.02026"
      x2="8.625"
      y2="3.70776"
      className="stroke"
    />
    <line
      x1="16.375"
      y1="8.02026"
      x2="16.375"
      y2="3.70776"
      className="stroke"
    />
    <line
      x1="4.5"
      y1="11.114"
      x2="20.5"
      y2="11.114"
      className="stroke"
    />
  </svg>
);

export default Calendar;
