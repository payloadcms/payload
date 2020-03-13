import React from 'react';

const Crosshair = () => {
  return (
    <svg
      width="20px"
      height="20px"
      viewBox="0 0 20 20"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      className="crosshair"
    >
      <g
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="square"
      >
        <g
          className="stroke"
          transform="translate(-0.500000, -0.500000)"
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

export default Crosshair;
