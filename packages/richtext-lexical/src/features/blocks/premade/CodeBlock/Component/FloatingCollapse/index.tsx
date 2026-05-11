import { useCollapsible, useTranslation } from '@payloadcms/ui'
import React from 'react'

import { CollapseIcon } from '../../../../../../lexical/ui/icons/Collapse/index.js'
import { ExpandIcon } from '../../../../../../lexical/ui/icons/Expand/index.js'
import './index.css'

const baseClass = 'code-block-floating-collapse-button'

export const FloatingCollapse: React.FC = () => {
  const { isCollapsed, toggle } = useCollapsible()
  const { t } = useTranslation()

  return (
    <button className={baseClass} onClick={toggle} type="button">
      {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
      <span>{isCollapsed ? t('general:expand') : t('general:collapse')}</span>
    </button>
  )
}
