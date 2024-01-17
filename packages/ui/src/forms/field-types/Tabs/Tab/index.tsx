import { I18n, getTranslation } from '@payloadcms/translations'
import { Tab, tabHasName } from 'payload/types'
import React from 'react'
import { ErrorPill } from '../../../../elements/ErrorPill'

type TabProps = {
  isActive?: boolean
  parentPath: string
  setIsActive: () => void
  tab: Tab
  baseClass: string
  i18n: I18n
}

export const TabComponent: React.FC<TabProps> = ({
  isActive,
  parentPath,
  setIsActive,
  tab,
  baseClass,
  i18n,
}) => {
  const hasName = tabHasName(tab)

  const pathSegments = []
  if (parentPath) pathSegments.push(parentPath)
  if (hasName) pathSegments.push(tab.name)
  const path = pathSegments.join('.')
  // const tabHasErrors = submitted && errorCount > 0

  return (
    <React.Fragment>
      {/* <WatchChildErrors
        fieldSchema={hasName ? undefined : tab.fields}
        path={path}
        setErrorCount={setErrorCount}
      /> */}
      <button
        className={[
          `${baseClass}__tab-button`,
          // tabHasErrors && `${baseClass}__tab-button--has-error`,
          isActive && `${baseClass}__tab-button--active`,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={setIsActive}
        type="button"
      >
        {tab.label ? getTranslation(tab.label, i18n) : hasName && tab.name}
        {/* {tabHasErrors && <ErrorPill count={errorCount} />} */}
      </button>
    </React.Fragment>
  )
}
