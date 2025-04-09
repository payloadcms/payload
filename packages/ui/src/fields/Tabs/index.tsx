'use client'
import type {
  ClientField,
  ClientTab,
  DocumentPreferences,
  SanitizedFieldPermissions,
  StaticDescription,
  TabsFieldClientComponent,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { tabHasName, toKebabCase } from 'payload/shared'
import React, { useCallback, useEffect, useState } from 'react'

import { useCollapsible } from '../../elements/Collapsible/provider.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { useFormFields } from '../../forms/Form/index.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { usePreferences } from '../../providers/Preferences/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { fieldBaseClass } from '../shared/index.js'
import { TabsProvider } from './provider.js'
import { TabComponent } from './Tab/index.js'
import './index.scss'

const baseClass = 'tabs-field'

export { TabsProvider }

function generateTabPath({ activeTabConfig, path }: { activeTabConfig: ClientTab; path: string }) {
  let tabPath = path

  if (tabHasName(activeTabConfig) && activeTabConfig.name) {
    if (path) {
      tabPath = `${path}.${activeTabConfig.name}`
    } else {
      tabPath = activeTabConfig.name
    }
  }

  return tabPath
}

const TabsFieldComponent: TabsFieldClientComponent = (props) => {
  const {
    field: { admin: { className } = {}, tabs = [] },
    forceRender = false,
    indexPath = '',
    parentPath = '',
    parentSchemaPath = '',
    path = '',
    permissions,
    readOnly,
  } = props

  const { getPreference, setPreference } = usePreferences()
  const { preferencesKey } = useDocumentInfo()
  const { i18n } = useTranslation()
  const { isWithinCollapsible } = useCollapsible()

  const tabStates = useFormFields(([fields]) => {
    return tabs.map((tab, index) => {
      const id = tab?.id

      return {
        index,
        passesCondition: fields?.[id]?.passesCondition ?? true,
        tab,
      }
    })
  })

  const [activeTabIndex, setActiveTabIndex] = useState<number>(
    () => tabStates.filter(({ passesCondition }) => passesCondition)?.[0]?.index ?? 0,
  )

  const tabsPrefKey = `tabs-${indexPath}`
  const [activeTabPath, setActiveTabPath] = useState<string>(() =>
    generateTabPath({ activeTabConfig: tabs[activeTabIndex], path: parentPath }),
  )

  const [activeTabSchemaPath, setActiveTabSchemaPath] = useState<string>(() =>
    generateTabPath({ activeTabConfig: tabs[0], path: parentSchemaPath }),
  )

  const activePathChildrenPath = tabHasName(tabs[activeTabIndex]) ? activeTabPath : parentPath
  const activeTabInfo = tabStates[activeTabIndex]
  const activeTabConfig = activeTabInfo?.tab
  const activePathSchemaChildrenPath = tabHasName(tabs[activeTabIndex])
    ? activeTabSchemaPath
    : parentSchemaPath

  const activeTabDescription = activeTabConfig.admin?.description ?? activeTabConfig.description

  const activeTabStaticDescription =
    typeof activeTabDescription === 'function'
      ? activeTabDescription({ i18n, t: i18n.t })
      : activeTabDescription

  const hasVisibleTabs = tabStates.some(({ passesCondition }) => passesCondition)

  const handleTabChange = useCallback(
    async (incomingTabIndex: number): Promise<void> => {
      setActiveTabIndex(incomingTabIndex)

      setActiveTabPath(
        generateTabPath({ activeTabConfig: tabs[incomingTabIndex], path: parentPath }),
      )
      setActiveTabSchemaPath(
        generateTabPath({ activeTabConfig: tabs[incomingTabIndex], path: parentSchemaPath }),
      )

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
    [
      tabs,
      parentPath,
      parentSchemaPath,
      getPreference,
      preferencesKey,
      setPreference,
      path,
      tabsPrefKey,
    ],
  )

  useEffect(() => {
    if (preferencesKey) {
      const getInitialPref = async () => {
        const existingPreferences: DocumentPreferences = await getPreference(preferencesKey)
        const initialIndex = path
          ? existingPreferences?.fields?.[path]?.tabIndex
          : existingPreferences?.fields?.[tabsPrefKey]?.tabIndex

        const newIndex = initialIndex || 0
        setActiveTabIndex(newIndex)

        setActiveTabPath(generateTabPath({ activeTabConfig: tabs[newIndex], path: parentPath }))
        setActiveTabSchemaPath(
          generateTabPath({ activeTabConfig: tabs[newIndex], path: parentSchemaPath }),
        )
      }
      void getInitialPref()
    }
  }, [path, getPreference, preferencesKey, tabsPrefKey, tabs, parentPath, parentSchemaPath])

  useEffect(() => {
    if (activeTabInfo?.passesCondition === false) {
      const nextTab = tabStates.find(({ passesCondition }) => passesCondition)
      if (nextTab) {
        void handleTabChange(nextTab.index)
      }
    }
  }, [activeTabInfo, tabStates, handleTabChange])

  return (
    <div
      className={[
        fieldBaseClass,
        className,
        baseClass,
        isWithinCollapsible && `${baseClass}--within-collapsible`,
        !hasVisibleTabs && `${baseClass}--hidden`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <TabsProvider>
        <div className={`${baseClass}__tabs-wrap`}>
          <div className={`${baseClass}__tabs`}>
            {tabStates.map(({ index, passesCondition, tab }) => (
              <TabComponent
                hidden={!passesCondition}
                isActive={activeTabIndex === index}
                key={index}
                parentPath={path}
                setIsActive={() => {
                  void handleTabChange(index)
                }}
                tab={tab}
              />
            ))}
          </div>
        </div>
        <div className={`${baseClass}__content-wrap`}>
          {activeTabConfig && (
            <TabContent
              description={activeTabStaticDescription}
              fields={activeTabConfig.fields}
              forceRender={forceRender}
              hidden={false}
              parentIndexPath={
                tabHasName(activeTabConfig)
                  ? ''
                  : `${indexPath ? indexPath + '-' : ''}` + String(activeTabInfo.index)
              }
              parentPath={activePathChildrenPath}
              parentSchemaPath={activePathSchemaChildrenPath}
              path={activeTabPath}
              permissions={
                permissions && typeof permissions === 'object' && 'name' in activeTabConfig
                  ? permissions[activeTabConfig.name] &&
                    typeof permissions[activeTabConfig.name] === 'object' &&
                    'fields' in permissions[activeTabConfig.name]
                    ? permissions[activeTabConfig.name].fields
                    : permissions[activeTabConfig.name]
                  : permissions
              }
              readOnly={readOnly}
            />
          )}
        </div>
      </TabsProvider>
    </div>
  )
}

export const TabsField = withCondition(TabsFieldComponent)

type ActiveTabProps = {
  readonly description: StaticDescription
  readonly fields: ClientField[]
  readonly forceRender?: boolean
  readonly hidden: boolean
  readonly label?: string
  readonly parentIndexPath: string
  readonly parentPath: string
  readonly parentSchemaPath: string
  readonly path: string
  readonly permissions: SanitizedFieldPermissions
  readonly readOnly: boolean
}

function TabContent({
  description,
  fields,
  forceRender,
  hidden,
  label,
  parentIndexPath,
  parentPath,
  parentSchemaPath,
  path,
  permissions,
  readOnly,
}: ActiveTabProps) {
  const { i18n } = useTranslation()

  const { customComponents: { AfterInput, BeforeInput, Description, Field } = {} } = useField({
    path,
  })

  if (Field) {
    return Field
  }

  return (
    <div
      className={[
        hidden && `${baseClass}__tab--hidden`,
        `${baseClass}__tab`,
        label && `${baseClass}__tabConfigLabel-${toKebabCase(getTranslation(label, i18n))}`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <RenderCustomComponent
        CustomComponent={Description}
        Fallback={
          <FieldDescription description={description} marginPlacement="bottom" path={path} />
        }
      />
      {BeforeInput}
      <RenderFields
        fields={fields}
        forceRender={forceRender}
        parentIndexPath={parentIndexPath}
        parentPath={parentPath}
        parentSchemaPath={parentSchemaPath}
        permissions={permissions}
        readOnly={readOnly}
      />
      {AfterInput}
    </div>
  )
}
