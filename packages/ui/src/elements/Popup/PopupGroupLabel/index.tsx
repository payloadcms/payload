import React from 'react'

import './index.css'

const baseClass = 'popup-list-group-label'

export const PopupListGroupLabel: React.FC<{
  label: string
}> = ({ label }) => {
  return (
    <p className={baseClass} data-popup-prevent-close>
      {label}
    </p>
  )
}
