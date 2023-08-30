import React from 'react'

import './index.scss'

const CloseMenu: React.FC = () => (
  <svg
    className="icon icon--close-menu"
    fill="none"
    viewBox="0 0 25 25"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      className="fill"
      height="2"
      transform="rotate(-45 5.42896 18.1569)"
      width="18"
      x="5.42896"
      y="18.1569"
    />
    <rect
      className="fill"
      height="2"
      transform="rotate(45 6.84314 5.42892)"
      width="18"
      x="6.84314"
      y="5.42892"
    />
  </svg>
)

export default CloseMenu
