import React from 'react'

import './index.scss'

const baseClass = 'floating-toolbar'

export const FloatingToolbar: React.FC<{
  children: React.ReactNode
}> = ({ children }) => <div className={baseClass}>{children}</div>
