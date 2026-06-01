import React from 'react'

import './index.css'

const baseClass = 'field-diff-label'

export const FieldDiffLabel: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className={baseClass}>{children}</div>
)
