import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { FieldTypes } from '../../forms/field-types'
import type { GlobalEditViewProps } from '../types'

import { getTranslation } from '../../../../utilities/getTranslation'
import { DocumentHeader } from '../../elements/DocumentHeader'
import { FormLoadingOverlayToggle } from '../../elements/Loading'
import Form from '../../forms/Form'
import { useActions } from '../../utilities/ActionsProvider'
import { OperationContext } from '../../utilities/OperationProvider'
import { SetStepNav } from '../collections/Edit/SetStepNav'
import { GlobalRoutes } from './Routes'
import { CustomGlobalComponent } from './Routes/CustomComponent'
import './index.scss'

const baseClass = 'global-edit'

const hasDefaultActions = (
  globalEditComponent: any,
): globalEditComponent is { Default: { actions: React.ComponentType<any>[] } } => {
  return (
    typeof globalEditComponent === 'object' &&
    globalEditComponent !== null &&
    'Default' in globalEditComponent &&
    'actions' in globalEditComponent.Default
  )
}

export type DefaultGlobalViewProps = GlobalEditViewProps & {
  disableRoutes?: boolean
  fieldTypes: FieldTypes
}

const DefaultGlobalView: React.FC<DefaultGlobalViewProps> = (props) => {
  const { i18n } = useTranslation('general')

  const {
    action,
    apiURL,
    data,
    disableRoutes,
    fieldTypes,
    global,
    initialState,
    isLoading,
    onSave,
    permissions,
  } = props

  const { setViewActions } = useActions()

  const { label } = global

  const hasSavePermission = permissions?.update?.permission

  useEffect(() => {
    if (hasDefaultActions(global.admin.components?.views?.Edit)) {
      const defaultActions = global.admin.components.views.Edit.Default?.actions
      if (defaultActions) {
        setViewActions(defaultActions || [])
      }
    }

    return () => {
      setViewActions([])
    }
  }, [global.admin.components.views.Edit, setViewActions])

  return (
    <main className={baseClass}>
      <OperationContext.Provider value="update">
        <SetStepNav global={global} />
        <Form
          action={action}
          className={`${baseClass}__form`}
          disabled={!hasSavePermission}
          initialState={initialState}
          method="post"
          onSuccess={onSave}
        >
          <FormLoadingOverlayToggle
            action="update"
            loadingSuffix={getTranslation(label, i18n)}
            name={`global-edit--${typeof label === 'string' ? label : label?.en}`}
          />
          {!isLoading && (
            <React.Fragment>
              <DocumentHeader apiURL={apiURL} data={data} global={global} />
              {disableRoutes ? (
                <CustomGlobalComponent view="Default" {...props} />
              ) : (
                <GlobalRoutes {...props} fieldTypes={fieldTypes} />
              )}
            </React.Fragment>
          )}
        </Form>
      </OperationContext.Provider>
    </main>
  )
}

export default DefaultGlobalView
