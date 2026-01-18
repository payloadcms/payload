'use client'
import type {
  ClientComponentProps,
  ClientTab,
  DocumentPreferences,
  SanitizedFieldPermissions,
  StaticDescription,
  TabsFieldClientComponent,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { getFieldPaths, toKebabCase } from 'payload/shared'
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
    schemaPath = '',
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

  const activeTabInfo = tabStates[activeTabIndex]
  const activeTabConfig = activeTabInfo?.tab
  const activeTabDescription = activeTabConfig.admin?.description ?? activeTabConfig.description

  const activeTabStaticDescription =
    typeof activeTabDescription === 'function'
      ? activeTabDescription({ i18n, t: i18n.t })
      : activeTabDescription

  const hasVisibleTabs = tabStates.some(({ passesCondition }) => passesCondition)

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
    [getPreference, preferencesKey, setPreference, path, tabsPrefKey],
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
              field={activeTabConfig}
              forceRender={forceRender}
              hidden={false}
              parentIndexPath={indexPath}
              parentPath={path}
              parentSchemaPath={schemaPath}
              path={path}
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
              tabIndex={activeTabIndex}
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
  readonly field: ClientTab
  readonly hidden: boolean
  readonly label?: string
  readonly parentIndexPath: string
  readonly parentPath: string
  readonly parentSchemaPath: string
  readonly path: string
  readonly permissions: SanitizedFieldPermissions
  readonly readOnly: boolean
  readonly tabIndex: number
} & Pick<ClientComponentProps, 'forceRender'>

function TabContent({
  description,
  field,
  forceRender,
  hidden,
  label,
  parentIndexPath,
  parentPath,
  parentSchemaPath,
  permissions,
  readOnly,
  tabIndex,
}: ActiveTabProps) {
  const { i18n } = useTranslation()

  const { customComponents: { AfterInput, BeforeInput, Description, Field } = {} } = useField()

  if (Field) {
    return Field
  }

  const { indexPath, path, schemaPath } = getFieldPaths({
    field,
    index: tabIndex,
    parentIndexPath,
    parentPath,
    parentSchemaPath,
  })

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
          <FieldDescription description={description} marginPlacement="bottom" path={parentPath} />
        }
      />
      {BeforeInput}
      <RenderFields
        fields={field.fields}
        forceRender={forceRender}
        parentIndexPath={indexPath}
        parentPath={path}
        parentSchemaPath={schemaPath}
        permissions={permissions}
        readOnly={readOnly}
      />
      {AfterInput}
    </div>
  )
}
