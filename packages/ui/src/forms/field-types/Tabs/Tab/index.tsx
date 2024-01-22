'use client'
import { getTranslation } from '@payloadcms/translations'
import { NamedTab, Tab } from 'payload/types'
import React from 'react'
import { ErrorPill } from '../../../../elements/ErrorPill'
import { WatchChildErrors } from '../../../WatchChildErrors'
import { useTranslation } from '../../../..'

import './index.scss'

type TabProps = {
  isActive?: boolean
  setIsActive: () => void
  pathSegments: string[]
  path: string
  label: Tab['label']
  name: NamedTab['name']
}

const baseClass = 'tabs-field__tab-button'

export const TabComponent: React.FC<TabProps> = (props) => {
  const { isActive, setIsActive, pathSegments, name, label } = props

  const { i18n } = useTranslation()

  const [errorCount, setErrorCount] = React.useState(0)

  const tabHasErrors = errorCount > 0

  return (
    <button
      className={[
        baseClass,
        tabHasErrors && `${baseClass}--has-error`,
        isActive && `${baseClass}--active`,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={setIsActive}
      type="button"
    >
      <WatchChildErrors pathSegments={pathSegments} setErrorCount={setErrorCount} />
      {label ? getTranslation(label, i18n) : name}
      {tabHasErrors && <ErrorPill i18n={i18n} count={errorCount} />}
    </button>
  )
}
