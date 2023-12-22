'use client'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { DefaultEditViewProps } from './types'

import { getTranslation } from 'payload/utilities'
import { DocumentHeader } from '../../elements/DocumentHeader'
import { FormLoadingOverlayToggle } from '../../elements/Loading'
import Form from '../../forms/Form'
import { useActions } from '../../providers/ActionsProvider'
import { useAuth } from '../../providers/Auth'
import { useDocumentEvents } from '../../providers/DocumentEvents'
import { OperationContext } from '../../providers/OperationProvider'
import './index.scss'
import { RenderCustomView } from './RenderCustomView'

const baseClass = 'collection-edit'

export const DefaultEdit: React.FC<DefaultEditViewProps> = (props) => {
  const { i18n } = useTranslation('general')
  const { refreshCookieAsync, user } = useAuth()

  const {
    id,
    action,
    apiURL,
    collection,
    customHeader,
    data,
    hasSavePermission,
    internalState,
    isEditing,
    isLoading,
    onSave: onSaveFromProps,
  } = props

  const { setViewActions } = useActions()

  const { reportUpdate } = useDocumentEvents()

  const { auth } = collection

  const classes = [baseClass, isEditing && `${baseClass}--is-editing`].filter(Boolean).join(' ')

  const onSave = useCallback(
    async (json) => {
      reportUpdate({
        id,
        entitySlug: collection.slug,
        updatedAt: json?.result?.updatedAt || new Date().toISOString(),
      })
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
    [id, onSaveFromProps, auth, user, refreshCookieAsync, collection, reportUpdate],
  )

  const operation = isEditing ? 'update' : 'create'

  useEffect(() => {
    const path = location.pathname

    if (!(path.endsWith(id) || path.endsWith('/create'))) {
      return
    }
    const editConfig = collection?.admin?.components?.views?.Edit
    const defaultActions =
      editConfig && 'Default' in editConfig && 'actions' in editConfig.Default
        ? editConfig.Default.actions
        : []

    setViewActions(defaultActions)
  }, [id, location.pathname, collection?.admin?.components?.views?.Edit, setViewActions])

  return (
    <main className={classes}>
      <OperationContext.Provider value={operation}>
        <Form
          action={action}
          className={`${baseClass}__form`}
          disabled={!hasSavePermission}
          initialState={internalState}
          method={id ? 'PATCH' : 'POST'}
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
              <RenderCustomView view="Default" {...props} />
            </React.Fragment>
          )}
        </Form>
      </OperationContext.Provider>
    </main>
  )
}
