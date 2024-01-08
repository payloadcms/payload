import React from 'react'

import {
  FormLoadingOverlayToggle,
  Form,
  OperationProvider,
  DocumentFields,
  DocumentControls,
  SetDocumentStepNav as SetStepNav,
  LeaveWithoutSaving,
} from '@payloadcms/ui'
// import { useActions } from '../../providers/ActionsProvider'
import './index.scss'
import { DefaultGlobalViewProps } from './types'

const baseClass = 'global-edit'

export const DefaultGlobalView: React.FC<DefaultGlobalViewProps> = (props) => {
  // const { i18n } = useTranslation('general')

  const {
    action,
    apiURL,
    data,
    // disableRoutes,
    // fieldTypes,
    globalConfig,
    state,
    // onSave,
    permissions,
    fieldTypes,
    config,
    user,
  } = props

  // const { setViewActions } = useActions()

  const { admin: { description } = {}, fields, label } = globalConfig

  // const onSave = useCallback(
  //   async (json) => {
  //     reportUpdate({
  //       entitySlug: global.slug,
  //       updatedAt: json?.result?.updatedAt || new Date().toISOString(),
  //     })

  //     getVersions()
  //     getDocPermissions()
  //     setUpdatedAt(json?.result?.updatedAt)

  //     const preferences = await getDocPreferences()

  //     const state = await buildStateFromSchema({
  //       config,
  //       data: json.result,
  //       fieldSchema: fields,
  //       locale,
  //       operation: 'update',
  //       preferences,
  //       t,
  //       user,
  //     })
  //     setInitialState(state)
  //   },
  //   [
  //     getVersions,
  //     fields,
  //     user,
  //     locale,
  //     t,
  //     getDocPermissions,
  //     getDocPreferences,
  //     config,
  //     global,
  //     reportUpdate,
  //   ],
  // )

  const hasSavePermission = permissions?.update?.permission

  // useEffect(() => {
  //   const path = location.pathname

  //   if (!path.endsWith(global.slug)) {
  //     return
  //   }

  //   const editConfig = global?.admin?.components?.views?.Edit
  //   const defaultActions =
  //     editConfig && 'Default' in editConfig && 'actions' in editConfig.Default
  //       ? editConfig.Default.actions
  //       : []

  //   setViewActions(defaultActions)
  // }, [global.slug, location.pathname, global?.admin?.components?.views?.Edit, setViewActions])

  return (
    <main className={baseClass}>
      <OperationProvider operation="update">
        <Form
          action={action}
          className={`${baseClass}__form`}
          disabled={!hasSavePermission}
          initialState={state}
          method="POST"
          // onSuccess={onSave}
        >
          <FormLoadingOverlayToggle
            action="update"
            // loadingSuffix={getTranslation(label, i18n)}
            name={`global-edit--${typeof label === 'string' ? label : label?.en}`}
          />

          {!(globalConfig.versions?.drafts && globalConfig.versions?.drafts?.autosave) && (
            <LeaveWithoutSaving />
          )}
          <SetStepNav globalSlug={globalConfig.slug} globalLabel={label} />
          <DocumentControls
            apiURL={apiURL}
            data={data}
            config={config}
            globalConfig={globalConfig}
            hasSavePermission={hasSavePermission}
            isEditing
            permissions={permissions}
          />
          <DocumentFields
            description={description}
            fieldTypes={fieldTypes}
            fields={fields}
            hasSavePermission={hasSavePermission}
            permissions={permissions}
            user={user}
            state={state}
            data={data}
          />
        </Form>
      </OperationProvider>
    </main>
  )
}
