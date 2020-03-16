import React from 'react';

const Crosshair = () => {
  return (
    <svg
      width="10px"
      height="10px"
      viewBox="0 0 10 10"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      className="icon crosshair"
    >
      <g
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="square"
        className="stroke"
      >
        <line
          x1="-1.11022302e-16"
          y1="5"
          x2="10"
          y2="5"
        />
        <line
          x1="5"
          y1="0"
          x2="5"
          y2="10"
        />
      </g>
    </svg>
  );
};

export default Crosshair;
