import type { ClientField } from 'payload'

import { ChevronIcon, Pill } from '@payloadcms/ui'
import React, { useState } from 'react'

import Label from '../Label/index.js'
import { countChangedFields } from './countChangedFields.js'
import { countChangedRows } from './countChangedRows.js'
import './index.scss'

const baseClass = 'field-diff-collapser'

type Props = {
  children: React.ReactNode
  comparison?: unknown
  initCollapsed?: boolean
  label: React.ReactNode
  version?: unknown
} & ( // The collapsible is either is iterable, or it has fields, but not both.
  | {
      fields: ClientField[]
      isIterable?: boolean
    }
  | {
      fields?: ClientField[]
      isIterable: boolean
    }
)

export const FieldDiffCollapser: React.FC<Props> = ({
  children,
  comparison,
  fields,
  initCollapsed = false,
  isIterable,
  label,
  version,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initCollapsed)

  const changeCount = isIterable
    ? countChangedRows({ comparison, version })
    : countChangedFields({
        comparison,
        fields,
        version,
      })

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
        {changeCount > 0 && (
          <Pill className={`${baseClass}__field-change-count`} pillStyle="light-gray" size="small">
            {changeCount}
          </Pill>
        )}
      </Label>
      {!isCollapsed && <div className={`${baseClass}__content`}>{children}</div>}
    </div>
  )
}
