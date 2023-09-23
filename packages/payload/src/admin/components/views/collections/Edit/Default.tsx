import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import { DocumentHeader } from '../../../elements/DocumentHeader'
import { FormLoadingOverlayToggle } from '../../../elements/Loading'
import Form from '../../../forms/Form'
import { useAuth } from '../../../utilities/Auth'
import { OperationContext } from '../../../utilities/OperationProvider'
import { CollectionRoutes } from './Routes'
import { CustomCollectionComponent } from './Routes/CustomComponent'
import './index.scss'

const baseClass = 'collection-edit'

const DefaultEditView: React.FC<Props> = (props) => {
  const { i18n } = useTranslation('general')
  const { refreshCookieAsync, user } = useAuth()

  const {
    id,
    action,
    apiURL,
    collection,
    customHeader,
    data,
    disableRoutes,
    hasSavePermission,
    internalState,
    isEditing,
    isLoading,
    onSave: onSaveFromProps,
  } = props

  const { auth } = collection

  const classes = [baseClass, isEditing && `${baseClass}--is-editing`].filter(Boolean).join(' ')

  const onSave = useCallback(
    async (json) => {
      if (auth && id === user.id) {
        await refreshCookieAsync()
      }

      if (typeof onSaveFromProps === 'function') {
        onSaveFromProps({
          ...json,
          operation: id ? 'update' : 'create',
        })
      }
    },
    [id, onSaveFromProps, auth, user, refreshCookieAsync],
  )

  const operation = isEditing ? 'update' : 'create'

  return (
    <React.Fragment>
      <div className={classes}>
        <OperationContext.Provider value={operation}>
          <Form
            action={action}
            className={`${baseClass}__form`}
            disabled={!hasSavePermission}
            initialState={internalState}
            method={id ? 'patch' : 'post'}
            onSuccess={onSave}
          >
            <FormLoadingOverlayToggle
              action={isLoading ? 'loading' : operation}
              formIsLoading={isLoading}
              loadingSuffix={getTranslation(collection.labels.singular, i18n)}
              name={`collection-edit--${
                typeof collection?.labels?.singular === 'string'
                  ? collection.labels.singular
                  : 'document'
              }`}
              type="withoutNav"
            />
            {!isLoading && (
              <React.Fragment>
                <DocumentHeader
                  apiURL={apiURL}
                  collection={collection}
                  customHeader={customHeader}
                  data={data}
                  id={id}
                  isEditing={isEditing}
                />
                {disableRoutes ? (
                  <CustomCollectionComponent view="Default" {...props} />
                ) : (
                  <CollectionRoutes {...props} />
                )}
              </React.Fragment>
            )}
          </Form>
        </OperationContext.Provider>
      </div>
    </React.Fragment>
  )
}

export default DefaultEditView
