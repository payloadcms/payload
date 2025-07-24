import React from 'react'

import './index.scss'

const baseClass = 'sticky-toolbar'

export const StickyToolbar: React.FC<{
  children: React.ReactNode
}> = ({ children }) => <div className={baseClass}>{children}</div>
