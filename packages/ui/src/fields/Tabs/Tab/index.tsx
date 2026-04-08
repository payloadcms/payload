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
  readonly hidden?: boolean
  readonly isActive?: boolean
  readonly parentPath: string
  readonly setIsActive: () => void
  readonly tab: ClientTab
}

export const TabComponent: React.FC<TabProps> = ({
  hidden,
  isActive,
  parentPath,
  setIsActive,
  tab,
}) => {
  const { i18n } = useTranslation()
  const [errorCount, setErrorCount] = useState(undefined)

  const path = [
    // removes parent 'tabs' path segment, i.e. `_index-0`
    ...(parentPath ? parentPath.split('.').slice(0, -1) : []),
    ...(tabHasName(tab) ? [tab.name] : []),
  ]

  const fieldHasErrors = errorCount > 0

  return (
    <React.Fragment>
      <WatchChildErrors fields={tab.fields} path={path} setErrorCount={setErrorCount} />
      <button
        className={[
          baseClass,
          fieldHasErrors && `${baseClass}--has-error`,
          isActive && `${baseClass}--active`,
          hidden && `${baseClass}--hidden`,
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
