import React from 'react'

import './index.css'

const baseClass = 'code-block-floating-collapse-button'
import { useCollapsible } from '@payloadcms/ui'

import { CollapseIcon } from '../../../../../../lexical/ui/icons/Collapse/index.js'
import { ExpandIcon } from '../../../../../../lexical/ui/icons/Expand/index.js'

export const FloatingCollapse: React.FC = () => {
  const { isCollapsed, toggle } = useCollapsible()

  return (
    <button className={baseClass} onClick={toggle} type="button">
      {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
      {/* TODO: Add 'expand'/'collapse' translation keys to packages/translations */}
      <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
    </button>
  )
}
