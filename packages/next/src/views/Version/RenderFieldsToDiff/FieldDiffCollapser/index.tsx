import { ChevronIcon } from '@payloadcms/ui'
import React, { useMemo, useState } from 'react'

import Label from '../Label/index.js'
import './index.scss'

const baseClass = 'field-diff-collapser'

type Props = {
  children: React.ReactNode
  comparison: any
  initCollapsed?: boolean
  label: React.ReactNode
  version: any
}

const FieldDiffCollapser: React.FC<Props> = ({
  children,
  comparison,
  initCollapsed = false,
  label,
  version,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initCollapsed)

  const hasChanges = useMemo(() => {
    return JSON.stringify(version) !== JSON.stringify(comparison)
  }, [version, comparison])

  return (
    <div className={baseClass}>
      <Label>
        <button
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          className={`${baseClass}__toggle-button`}
          onClick={() => setIsCollapsed(!isCollapsed)}
          type="button"
        >
          <ChevronIcon direction={isCollapsed ? 'right' : 'down'} />
        </button>
        <span className={`${baseClass}__label`}>{label}</span>
        {isCollapsed && hasChanges && (
          <span className={`${baseClass}__has-changes-indicator`}>
            <span className={`${baseClass}__plus-sign`}>+</span>
            <span className={`${baseClass}__minus-sign`}>–</span>
          </span>
        )}
      </Label>
      {!isCollapsed && <div className={`${baseClass}__content`}>{children}</div>}
    </div>
  )
}

export default FieldDiffCollapser
