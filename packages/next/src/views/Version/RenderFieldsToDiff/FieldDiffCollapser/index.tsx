import type { ClientField } from 'payload'

import { ChevronIcon, Pill, useTranslation } from '@payloadcms/ui'
import React, { useState } from 'react'

import Label from '../Label/index.js'
import { countChangedFields } from './countChangedFields.js'
import './index.scss'

const baseClass = 'field-diff-collapser'

type Props = {
  children: React.ReactNode
  comparison?: unknown
  fields: ClientField[]
  initCollapsed?: boolean
  label: React.ReactNode
  version?: unknown
}

export const FieldDiffCollapser: React.FC<Props> = ({
  children,
  comparison,
  fields,
  initCollapsed = false,
  label,
  version,
}) => {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(initCollapsed)

  const changeCount = countChangedFields({
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
            {t('version:changedFieldsCount', { count: changeCount })}
          </Pill>
        )}
      </Label>
      {!isCollapsed && <div className={`${baseClass}__content`}>{children}</div>}
    </div>
  )
}
