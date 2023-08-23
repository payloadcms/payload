import React from 'react';

const StrikethroughIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className="graphic strikethrough-icon"
  >
    <path
      fill="none"
      d="M0 0h24v24H0z"
    />
    <path
      className="fill"
      d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"
    />
  </svg>
);

export default StrikethroughIcon;
