import { ChevronIcon } from '@payloadcms/ui'
import React, { useState } from 'react'

import Label from '../Label/index.js'
import './index.scss'

const baseClass = 'field-diff-collapser'

type Props = {
  children: React.ReactNode
  initCollapsed?: boolean
  label: React.ReactNode
}

const FieldDiffCollapser: React.FC<Props> = ({ children, initCollapsed = false, label }) => {
  const [isCollapsed, setIsCollapsed] = useState(initCollapsed)
  return (
    <div className={baseClass}>
      <Label>
        <button
          className={`${baseClass}__toggle-button`}
          onClick={() => setIsCollapsed(!isCollapsed)}
          type="button"
        >
          <ChevronIcon direction={isCollapsed ? 'right' : 'down'} />
        </button>
        {label}
      </Label>
      {!isCollapsed && <div className={`${baseClass}__content`}>{children}</div>}
    </div>
  )
}

export default FieldDiffCollapser
