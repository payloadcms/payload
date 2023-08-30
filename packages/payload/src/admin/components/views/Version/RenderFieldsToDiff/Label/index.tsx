import React from 'react'

import './index.scss'

const baseClass = 'field-diff-label'

const Label: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className={baseClass}>{children}</div>
)

export default Label
