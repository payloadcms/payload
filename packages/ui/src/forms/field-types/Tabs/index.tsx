'use client'
import React, { useCallback, useEffect, useState } from 'react'

import type { Props } from './types'

import { useCollapsible } from '../../../elements/Collapsible/provider'
import { useDocumentInfo } from '../../../providers/DocumentInfo'
import { usePreferences } from '../../../providers/Preferences'
import RenderFields from '../../RenderFields'
import { withCondition } from '../../withCondition'
import { fieldBaseClass } from '../shared'
import { TabsProvider } from './provider'
import { TabComponent } from './Tab'
import { getTranslation } from '@payloadcms/translations'
import { DocumentPreferences, tabHasName } from 'payload/types'
import { toKebabCase } from 'payload/utilities'
import { useTranslation } from '../../../providers/Translation'
import { useFieldPath } from '../../FieldPathProvider'

import './index.scss'

const baseClass = 'tabs-field'

const TabsField: React.FC<Props> = (props) => {
  const {
    className,
    readOnly,
    forceRender = false,
    indexPath,
    permissions,
    Description,
    fieldMap,
    path: pathFromProps,
    name,
  } = props

  const pathFromContext = useFieldPath()
  const path = pathFromContext || pathFromProps || name
  const { getPreference, setPreference } = usePreferences()
  const { preferencesKey } = useDocumentInfo()
  const { i18n } = useTranslation()
  const isWithinCollapsible = useCollapsible()
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0)
  const tabsPrefKey = `tabs-${indexPath}`

  const tabs = 'tabs' in props ? props.tabs : []

  useEffect(() => {
    const getInitialPref = async () => {
      const existingPreferences: DocumentPreferences = await getPreference(preferencesKey)
      const initialIndex = path
        ? existingPreferences?.fields?.[path]?.tabIndex
        : existingPreferences?.fields?.[tabsPrefKey]?.tabIndex
      setActiveTabIndex(initialIndex || 0)
    }
    void getInitialPref()
  }, [path, indexPath, getPreference, preferencesKey, tabsPrefKey])

  const handleTabChange = useCallback(
    async (incomingTabIndex: number) => {
      setActiveTabIndex(incomingTabIndex)

      const existingPreferences: DocumentPreferences = await getPreference(preferencesKey)

      setPreference(preferencesKey, {
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
        isWithinCollapsible && `${baseClass}--within-collapsible`,
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
                {Description}
                <RenderFields
                  fieldMap={fieldMap}
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
