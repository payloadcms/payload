import { I18n, getTranslation } from '@payloadcms/translations'
import { Tab, tabHasName } from 'payload/types'
import React from 'react'
import { ErrorPill } from '../../../../elements/ErrorPill'
import { getNestedFieldState } from '../../../WatchChildErrors/getNestedFieldState'
import { FormState } from '../../../Form/types'
import './index.scss'

type TabProps = {
  isActive?: boolean
  parentPath: string
  setIsActive: () => void
  tab: Tab
  i18n: I18n
  formState: FormState
}

const baseClass = 'tabs-field__tab-button'

export const TabComponent: React.FC<TabProps> = (props) => {
  const { isActive, parentPath, setIsActive, tab, i18n, formState } = props

  const isNamedTab = tabHasName(tab)

  const pathSegments = []

  if (parentPath) pathSegments.push(parentPath)
  if (isNamedTab) pathSegments.push(tab.name)

  const path = pathSegments.join('.')

  let errorCount = 0

  if (isNamedTab) {
    const nestedFieldState = getNestedFieldState({
      formState,
      path,
      fieldSchema: tab.fields,
    })

    errorCount = nestedFieldState.errorCount
  }

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
      {tab.label ? getTranslation(tab.label, i18n) : isNamedTab && tab.name}
      {tabHasErrors && <ErrorPill i18n={i18n} count={errorCount} />}
    </button>
  )
}
