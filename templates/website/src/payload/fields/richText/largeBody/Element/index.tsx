import React from 'react'

import './index.scss'

const baseClass = 'rich-text-large-body'

const LargeBodyElement: React.FC<{
  attributes: any
  children: React.ReactNode
  element: any
}> = ({ attributes, children }) => (
  <div {...attributes}>
    <span className={baseClass}>{children}</span>
  </div>
)
export default LargeBodyElement
