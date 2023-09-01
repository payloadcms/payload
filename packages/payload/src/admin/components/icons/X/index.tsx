import React from 'react'

import './index.scss'

const X: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={[className, 'icon icon--x'].filter(Boolean).join(' ')}
    height="25"
    viewBox="0 0 25 25"
    width="25"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line className="stroke" x1="8.74612" x2="16.3973" y1="16.347" y2="8.69584" />
    <line className="stroke" x1="8.6027" x2="16.2539" y1="8.69585" y2="16.3471" />
  </svg>
)

export default X
