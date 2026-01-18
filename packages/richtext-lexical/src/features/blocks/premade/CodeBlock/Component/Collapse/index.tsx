import React from 'react'

import './index.scss'

const baseClass = 'code-block-collapse-button'
import { useCollapsible } from '@payloadcms/ui'

import { CollapseIcon } from '../../../../../../lexical/ui/icons/Collapse/index.js'

export const Collapse: React.FC = () => {
  const { toggle } = useCollapsible()
  return (
    <button className={baseClass} onClick={toggle} type="button">
      <CollapseIcon />
    </button>
  )
}
