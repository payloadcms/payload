import React from 'react'

import type { Props } from './types'

import { tabHasName } from 'payload/types'
import FieldDescription from '../../FieldDescription'
import { createNestedFieldPath } from '../../Form/createNestedFieldPath'
import RenderFields from '../../RenderFields'
import './index.scss'
import { TabsProvider } from './provider'
import { TabComponent } from './Tab'
import { Wrapper } from './Wrapper'
import { getTranslation } from '@payloadcms/translations'
import { toKebabCase } from 'payload/utilities'

const baseClass = 'tabs-field'

const TabsField: React.FC<Props> = async (props) => {
  const {
    admin: { className, readOnly },
    fieldTypes,
    forceRender = false,
    indexPath,
    path,
    permissions,
    tabs,
    formState,
    user,
    i18n,
    payload,
    docPreferences,
  } = props

  const tabsPrefKey = `tabs-${indexPath}`

  const activeTabIndex = docPreferences?.fields?.[path || tabsPrefKey]?.tabIndex || 0

  const activeTabConfig = tabs[activeTabIndex]

  // TODO: make this a server action
  // const handleTabChange = useCallback(
  //   async (incomingTabIndex: number) => {
  //     setActiveTabIndex(incomingTabIndex)

  //     const existingPreferences: DocumentPreferences = await getPreference(preferencesKey)

  //     setPreference(preferencesKey, {
  //       ...existingPreferences,
  //       ...(path
  //         ? {
  //             fields: {
  //               ...(existingPreferences?.fields || {}),
  //               [path]: {
  //                 ...existingPreferences?.fields?.[path],
  //                 tabIndex: incomingTabIndex,
  //               },
  //             },
  //           }
  //         : {
  //             fields: {
  //               ...existingPreferences?.fields,
  //               [tabsPrefKey]: {
  //                 ...existingPreferences?.fields?.[tabsPrefKey],
  //                 tabIndex: incomingTabIndex,
  //               },
  //             },
  //           }),
  //     })
  //   },
  //   [preferencesKey, getPreference, setPreference, path, tabsPrefKey],
  // )

  return (
    <Wrapper className={className}>
      <TabsProvider>
        <div className={`${baseClass}__tabs-wrap`}>
          <div className={`${baseClass}__tabs`}>
            {tabs.map((tab, tabIndex) => {
              return (
                <TabComponent
                  isActive={activeTabIndex === tabIndex}
                  key={tabIndex}
                  parentPath={path}
                  setIsActive={undefined}
                  // setIsActive={() => handleTabChange(tabIndex)}
                  tab={tab}
                  i18n={i18n}
                  formState={formState}
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
                  user={user}
                  formState={formState}
                  i18n={i18n}
                  payload={payload}
                />
              </div>
            </React.Fragment>
          )}
        </div>
      </TabsProvider>
    </Wrapper>
  )
}

export default TabsField
