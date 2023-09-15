import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { getTranslation } from '../../../../utilities/getTranslation'
import { DocumentHeader } from '../../elements/DocumentHeader'
import { FormLoadingOverlayToggle } from '../../elements/Loading'
import Form from '../../forms/Form'
import { OperationContext } from '../../utilities/OperationProvider'
import { GlobalRoutes } from './Routes'
import './index.scss'

const baseClass = 'global-edit'

const DefaultGlobalView: React.FC<Props> = (props) => {
  const { action, apiURL, data, global, initialState, isLoading, onSave, permissions } = props

  const { i18n } = useTranslation('general')

  const { label } = global

  const hasSavePermission = permissions?.update?.permission

  return (
    <div className={baseClass}>
      <OperationContext.Provider value="update">
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
              <GlobalRoutes {...props} />
            </React.Fragment>
          )}
        </Form>
      </OperationContext.Provider>
    </div>
  )
}

export default DefaultGlobalView
