import React from 'react'

import './index.css'

const baseClass = 'field-diff-label'

export const FieldDiffLabel: React.FC<{ children?: React.ReactNode; id?: string }> = ({
  id,
  children,
}) => (
  <div className={baseClass} id={id}>
    {children}
  </div>
)
