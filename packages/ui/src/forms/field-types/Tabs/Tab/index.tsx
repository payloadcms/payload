'use client'
import { getTranslation } from '@payloadcms/translations'
import React, { useState } from 'react'
import { ErrorPill } from '../../../../elements/ErrorPill'
import { WatchChildErrors } from '../../../WatchChildErrors'
import { useTranslation } from '../../../..'
import { ReducedTab } from '../../../RenderFields/buildFieldMap'

import './index.scss'

const baseClass = 'tabs-field__tab-button'

type TabProps = {
  isActive?: boolean
  parentPath: string
  setIsActive: () => void
  tab: ReducedTab
}

export const TabComponent: React.FC<TabProps> = ({ isActive, parentPath, setIsActive, tab }) => {
  const { label, name } = tab

  const { i18n } = useTranslation()
  const [errorCount, setErrorCount] = useState(undefined)
  const hasName = 'name' in tab

  const path = `${parentPath ? `${parentPath}.` : ''}${'name' in tab ? name : ''}`
  const fieldHasErrors = errorCount > 0

  return (
    <React.Fragment>
      <WatchChildErrors fieldMap={tab.subfields} path={path} setErrorCount={setErrorCount} />
      <button
        className={[
          baseClass,
          fieldHasErrors && `${baseClass}--has-error`,
          isActive && `${baseClass}--active`,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={setIsActive}
        type="button"
      >
        {label ? getTranslation(label, i18n) : hasName && name}
        {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} />}
      </button>
    </React.Fragment>
  )
}
