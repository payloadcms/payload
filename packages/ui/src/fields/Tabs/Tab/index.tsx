'use client'

import type { ClientTab } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { tabHasName } from 'payload/shared'
import React, { useState } from 'react'

import { ErrorPill } from '../../../elements/ErrorPill/index.js'
import { WatchChildErrors } from '../../../forms/WatchChildErrors/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'tabs-field__tab-button'

type TabProps = {
  readonly isActive?: boolean
  readonly parentPath: string
  readonly setIsActive: () => void
  readonly tab: ClientTab
}

export const TabComponent: React.FC<TabProps> = ({ isActive, parentPath, setIsActive, tab }) => {
  const { i18n } = useTranslation()
  const [errorCount, setErrorCount] = useState(undefined)

  const path = `${parentPath ? `${parentPath}.` : ''}${tabHasName(tab) ? tab.name : ''}`
  const fieldHasErrors = errorCount > 0

  return (
    <React.Fragment>
      <WatchChildErrors fields={tab.fields} path={path} setErrorCount={setErrorCount} />
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
        {tab.label ? getTranslation(tab.label, i18n) : tabHasName(tab) ? tab.name : ''}
        {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} />}
      </button>
    </React.Fragment>
  )
}
