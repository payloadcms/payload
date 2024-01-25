'use client'
import { getTranslation } from '@payloadcms/translations'
import { Tab, tabHasName } from 'payload/types'
import React, { useState } from 'react'
import { ErrorPill } from '../../../../elements/ErrorPill'
import { WatchChildErrors } from '../../../WatchChildErrors'
import { useFormSubmitted, useTranslation } from '../../../..'

import './index.scss'

const baseClass = 'tabs-field__tab-button'

type TabProps = {
  isActive?: boolean
  parentPath: string
  setIsActive: () => void
  tab: Tab
}

export const TabComponent: React.FC<TabProps> = ({ isActive, parentPath, setIsActive, tab }) => {
  const { i18n } = useTranslation()
  const [errorCount, setErrorCount] = useState(undefined)
  const hasName = tabHasName(tab)
  const submitted = useFormSubmitted()

  const pathSegments = []
  if (parentPath) pathSegments.push(parentPath)
  if (hasName) pathSegments.push(tab.name)
  const path = pathSegments.join('.')
  const tabHasErrors = submitted && errorCount > 0

  return (
    <React.Fragment>
      <WatchChildErrors
        fieldSchema={hasName ? undefined : tab.fields}
        path={path}
        setErrorCount={setErrorCount}
      />
      <button
        className={[
          `${baseClass}__tab-button`,
          tabHasErrors && `${baseClass}__tab-button--has-error`,
          isActive && `${baseClass}__tab-button--active`,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={setIsActive}
        type="button"
      >
        {tab.label ? getTranslation(tab.label, i18n) : hasName && tab.name}
        {tabHasErrors && <ErrorPill count={errorCount} i18n={i18n} />}
      </button>
    </React.Fragment>
  )
}
