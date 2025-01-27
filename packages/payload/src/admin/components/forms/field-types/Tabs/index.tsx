import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Tab } from '../../../../../fields/config/types'
import type { DocumentPreferences } from '../../../../../preferences/types'
import type { Props } from './types'

import { tabHasName } from '../../../../../fields/config/types'
import { getTranslation } from '../../../../../utilities/getTranslation'
import toKebabCase from '../../../../../utilities/toKebabCase'
import { useCollapsible } from '../../../elements/Collapsible/provider'
import { ErrorPill } from '../../../elements/ErrorPill'
import { useDocumentInfo } from '../../../utilities/DocumentInfo'
import { usePreferences } from '../../../utilities/Preferences'
import FieldDescription from '../../FieldDescription'
import { useFormSubmitted } from '../../Form/context'
import { createNestedFieldPath } from '../../Form/createNestedFieldPath'
import RenderFields from '../../RenderFields'
import { WatchChildErrors } from '../../WatchChildErrors'
import withCondition from '../../withCondition'
import { fieldBaseClass } from '../shared'
import './index.scss'
import { TabsProvider } from './provider'

const baseClass = 'tabs-field'

type TabProps = {
  isActive?: boolean
  parentPath: string
  setIsActive: () => void
  tab: Tab
}

const TabComponent: React.FC<TabProps> = ({ isActive, parentPath, setIsActive, tab }) => {
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
        {tabHasErrors && <ErrorPill count={errorCount} />}
      </button>
    </React.Fragment>
  )
}

const TabsField: React.FC<Props> = (props) => {
  const {
    admin: { className, readOnly },
    fieldTypes,
    forceRender = false,
    indexPath,
    path,
    permissions,
    tabs,
  } = props

  const { getPreference, setPreference } = usePreferences()
  const { preferencesKey } = useDocumentInfo()
  const { i18n } = useTranslation()

  const { withinCollapsible } = useCollapsible()
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0)
  const tabsPrefKey = `tabs-${indexPath}`

  useEffect(() => {
    if (preferencesKey) {
      const getInitialPref = async () => {
        const existingPreferences: DocumentPreferences = await getPreference(preferencesKey)
        const initialIndex = path
          ? existingPreferences?.fields?.[path]?.tabIndex
          : existingPreferences?.fields?.[tabsPrefKey]?.tabIndex
        setActiveTabIndex(initialIndex || 0)
      }
      void getInitialPref()
    }
  }, [path, indexPath, getPreference, preferencesKey, tabsPrefKey])

  const handleTabChange = useCallback(
    async (incomingTabIndex: number) => {
      setActiveTabIndex(incomingTabIndex)

      const existingPreferences: DocumentPreferences = await getPreference(preferencesKey)

      if (preferencesKey) {
        await setPreference(preferencesKey, {
          ...existingPreferences,
          ...(path
            ? {
                fields: {
                  ...(existingPreferences?.fields || {}),
                  [path]: {
                    ...existingPreferences?.fields?.[path],
                    tabIndex: incomingTabIndex,
                  },
                },
              }
            : {
                fields: {
                  ...existingPreferences?.fields,
                  [tabsPrefKey]: {
                    ...existingPreferences?.fields?.[tabsPrefKey],
                    tabIndex: incomingTabIndex,
                  },
                },
              }),
        })
      }
    },
    [preferencesKey, getPreference, setPreference, path, tabsPrefKey],
  )

  const activeTabConfig = tabs[activeTabIndex]

  return (
    <div
      className={[
        fieldBaseClass,
        className,
        baseClass,
        withinCollapsible && `${baseClass}--within-collapsible`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <TabsProvider>
        <div className={`${baseClass}__tabs-wrap`}>
          <div className={`${baseClass}__tabs`}>
            {tabs.map((tab, tabIndex) => {
              return (
                <TabComponent
                  isActive={activeTabIndex === tabIndex}
                  key={tabIndex}
                  parentPath={path}
                  setIsActive={() => handleTabChange(tabIndex)}
                  tab={tab}
                />
              )
            })}
          </div>
        </div>
        <div className={`${baseClass}__content-wrap`}>
          {activeTabConfig && (
            <React.Fragment>
              <div
                className={[
                  `${baseClass}__tab`,
                  activeTabConfig.label &&
                    `${baseClass}__tabConfigLabel-${toKebabCase(
                      getTranslation(activeTabConfig.label, i18n),
                    )}`,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <FieldDescription
                  className={`${baseClass}__description`}
                  description={activeTabConfig.description}
                  marginPlacement="bottom"
                  path={path}
                />
                <RenderFields
                  fieldSchema={activeTabConfig.fields.map((field) => {
                    const pathSegments = []

                    if (path) pathSegments.push(path)
                    if (tabHasName(activeTabConfig)) pathSegments.push(activeTabConfig.name)

                    return {
                      ...field,
                      path: createNestedFieldPath(pathSegments.join('.'), field),
                    }
                  })}
                  fieldTypes={fieldTypes}
                  forceRender={forceRender}
                  indexPath={indexPath}
                  key={
                    activeTabConfig.label
                      ? getTranslation(activeTabConfig.label, i18n)
                      : activeTabConfig['name']
                  }
                  margins="small"
                  permissions={
                    tabHasName(activeTabConfig) && permissions?.[activeTabConfig.name]
                      ? permissions[activeTabConfig.name].fields
                      : permissions
                  }
                  readOnly={readOnly}
                />
              </div>
            </React.Fragment>
          )}
        </div>
      </TabsProvider>
    </div>
  )
}

export default withCondition(TabsField)
