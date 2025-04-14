import React from 'react'

import './index.scss'

const baseClass = 'field-diff-label'

export const FieldDiffLabel: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className={baseClass}>{children}</div>
)
