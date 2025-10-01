import React from 'react'

import './index.scss'

const baseClass = 'code-block-floating-collapse-button'
import { useCollapsible } from '@payloadcms/ui'

import { CollapseIcon } from '../../../../../../lexical/ui/icons/Collapse/index.js'

export const FloatingCollapse: React.FC = () => {
  const { isCollapsed, toggle } = useCollapsible()

  if (!isCollapsed) {
    return null
  }

  return (
    <button className={baseClass} onClick={toggle} type="button">
      <CollapseIcon />
    </button>
  )
}
