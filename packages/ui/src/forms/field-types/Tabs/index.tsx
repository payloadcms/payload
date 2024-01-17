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

const baseClass = 'tabs-field'

const TabsField: React.FC<Props> = (props) => {
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
  } = props

  const tabsPrefKey = `tabs-${indexPath}`

  // useEffect(() => {
  //   const getInitialPref = async () => {
  //     const existingPreferences: DocumentPreferences = await getPreference(preferencesKey)
  //     const initialIndex = path
  //       ? existingPreferences?.fields?.[path]?.tabIndex
  //       : existingPreferences?.fields?.[tabsPrefKey]?.tabIndex
  //     setActiveTabIndex(initialIndex || 0)
  //   }
  //   void getInitialPref()
  // }, [path, indexPath, getPreference, preferencesKey, tabsPrefKey])

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

  // TODO: wire this in
  const activeTabIndex = 0

  const activeTabConfig = tabs[activeTabIndex]

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
                  // activeTabConfig.label &&
                  //   `${baseClass}__tabConfigLabel-${toKebabCase(
                  //     getTranslation(activeTabConfig.label, i18n),
                  //   )}`,
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
                      ? activeTabConfig.label // ? getTranslation(activeTabConfig.label, i18n)
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
