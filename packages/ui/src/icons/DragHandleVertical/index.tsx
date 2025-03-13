import React from 'react'

import './index.scss'

export const DragHandleVerticalIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className="icon icon--drag-handle-vertical"
    fill="none"
    height="20"
    viewBox="0 0 20 20"
    width="20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill"
      d="M4.16687 8.75H15.8335"
      stroke="#2F2F2F"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      className="fill"
      d="M4.16687 12.5H15.8335"
      stroke="#2F2F2F"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
