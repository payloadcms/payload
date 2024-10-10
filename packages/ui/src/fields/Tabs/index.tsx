'use client'
import type { DocumentPreferences, TabsFieldClientComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { tabHasName, toKebabCase } from 'payload/shared'
import React, { useCallback, useEffect, useState } from 'react'

import { useCollapsible } from '../../elements/Collapsible/provider.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useFormFields } from '../../forms/Form/context.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'
import { TabsProvider } from './provider.js'
import { TabComponent } from './Tab/index.js'

const baseClass = 'tabs-field'

export { TabsProvider }

const TabsFieldComponent: TabsFieldClientComponent = (props) => {
  const {
    field,
    field: {
      _path: pathFromProps,
      admin: { className, readOnly: readOnlyFromAdmin } = {},
      tabs = [],
    },
    forceRender = false,
    readOnly: readOnlyFromTopLevelProps,
  } = props

  const {
    indexPath,
    path: pathFromContext,
    readOnly: readOnlyFromContext,
    schemaPath,
    siblingPermissions,
  } = useFieldProps()
  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

  const readOnly = readOnlyFromProps || readOnlyFromContext
  const path = pathFromContext ?? pathFromProps
  const { getPreference, setPreference } = usePreferences()
  const { preferencesKey } = useDocumentInfo()
  const { i18n } = useTranslation()
  const { isWithinCollapsible } = useCollapsible()
  const tabsPrefKey = `tabs-${indexPath}`

  const tabInfos = useFormFields(([fields]) => {
    return tabs.map((tab, index) => {
      const tabRef = 'name' in tab ? tab.name : index
      const formStateID = `${field.id}.${tabRef}`

      return {
        index,
        passesCondition: fields?.[formStateID]?.passesCondition ?? true,
        tab,
      }
    })
  })

  const [activeTabIndex, setActiveTabIndex] = useState<number>(() => {
    return tabInfos.filter(({ passesCondition }) => passesCondition)?.[0]?.index ?? 0
  })

  const activeTabInfo = tabInfos[activeTabIndex]
  const activeTabConfig = activeTabInfo.tab

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
  }, [path, getPreference, preferencesKey, tabsPrefKey])

  const handleTabChange = useCallback(
    async (incomingTabIndex: number): Promise<void> => {
      setActiveTabIndex(incomingTabIndex)

      const existingPreferences: DocumentPreferences = await getPreference(preferencesKey)

      if (preferencesKey) {
        void setPreference(preferencesKey, {
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

  useEffect(() => {
    if (activeTabInfo.passesCondition === false) {
      const nextTab = tabInfos.find(({ passesCondition }) => passesCondition)
      if (nextTab) {
        void handleTabChange(nextTab.index)
      }
    }
  }, [activeTabInfo, tabInfos, handleTabChange])

  function generateTabPath() {
    let tabPath = path
    if (path && tabHasName(activeTabConfig) && activeTabConfig.name) {
      tabPath = `${path}.${activeTabConfig.name}`
    } else if (!path && tabHasName(activeTabConfig) && activeTabConfig.name) {
      tabPath = activeTabConfig.name
    }

    return tabPath
  }

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
            {tabInfos.map(({ index, passesCondition, tab }) => {
              return passesCondition ? (
                <TabComponent
                  isActive={activeTabIndex === index}
                  key={index}
                  parentPath={path}
                  setIsActive={() => {
                    void handleTabChange(index)
                  }}
                  tab={tab}
                />
              ) : null
            })}
          </div>
        </div>
        <div className={`${baseClass}__content-wrap`}>
          {activeTabInfo?.passesCondition && activeTabConfig && (
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
              <FieldDescription Description={field?.admin?.components?.Description} field={field} />
              <RenderFields
                fields={activeTabConfig.fields}
                forceRender={forceRender}
                key={
                  activeTabConfig.label
                    ? getTranslation(activeTabConfig.label, i18n)
                    : activeTabConfig['name']
                }
                margins="small"
                path={generateTabPath()}
                permissions={
                  'name' in activeTabConfig && siblingPermissions?.[activeTabConfig.name]?.fields
                    ? siblingPermissions[activeTabConfig.name]?.fields
                    : siblingPermissions
                }
                readOnly={readOnly}
                schemaPath={`${schemaPath ? `${schemaPath}` : ''}${tabHasName(activeTabConfig) && activeTabConfig.name ? `.${activeTabConfig.name}` : ''}`}
              />
            </div>
          )}
        </div>
      </TabsProvider>
    </div>
  )
}

export const TabsField = withCondition(TabsFieldComponent)
