import React from 'react'

import './index.css'

const baseClass = 'code-block-collapse-button'
import { useCollapsible } from '@payloadcms/ui'

import { CollapseIcon } from '../../../../../../lexical/ui/icons/Collapse/index.js'
import { ExpandIcon } from '../../../../../../lexical/ui/icons/Expand/index.js'

export const Collapse: React.FC = () => {
  const { isCollapsed, toggle } = useCollapsible()
  return (
    <button className={baseClass} onClick={toggle} type="button">
      {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
    </button>
  )
}
