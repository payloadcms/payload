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

export type DefaultGlobalViewProps = GlobalEditViewProps & {
  customHeader?: React.ReactNode
  disableRoutes?: boolean
  fieldTypes: FieldTypes
}

const DefaultGlobalView: React.FC<DefaultGlobalViewProps> = (props) => {
  const { i18n } = useTranslation('general')

  const {
    action,
    apiURL,
    customHeader,
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
    const path = location.pathname

    if (!path.endsWith(global.slug)) {
      return
    }

    const editConfig = global?.admin?.components?.views?.Edit
    const defaultActions =
      editConfig && 'Default' in editConfig && 'actions' in editConfig.Default
        ? editConfig.Default.actions
        : []

    setViewActions(defaultActions)

    return () => {
      setViewActions([])
    }
  }, [global.slug, location.pathname, global?.admin?.components?.views?.Edit, setViewActions])

  return (
    <main className={`${baseClass} ${baseClass}--${global.slug}`}>
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
              <DocumentHeader
                apiURL={apiURL}
                customHeader={customHeader}
                data={data}
                global={global}
              />
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
