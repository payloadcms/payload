import React from 'react';

import './index.scss';

const X = () => {
  return (
    <svg
      width="15px"
      height="16px"
      viewBox="0 0 15 16"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      className="x"
    >
      <g
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="square"
      >
        <g
          transform="translate(7.000000, 8.000000) rotate(-315.000000) translate(-7.000000, -8.000000) translate(-3.500000, -2.500000)"
          className="stroke"
        >
          <line
            x1="11"
            y1="1"
            x2="11"
            y2="20"
            id="Line"
          />
          <line
            x1="10.5"
            y1="0.5"
            x2="10.5"
            y2="19.5"
            id="Line"
            transform="translate(10.500000, 10.000000) rotate(90.000000) translate(-10.500000, -10.000000) "
          />
        </g>
      </g>
    </svg>
  );
};

export default X;
