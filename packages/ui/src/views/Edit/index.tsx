import React from 'react'

import type { DefaultEditViewProps } from './types'

import { FormLoadingOverlayToggle } from '../../elements/Loading'
import Form from '../../forms/Form'
import { OperationProvider } from '../../providers/OperationProvider'
import { RenderCustomView } from './RenderCustomView'

import './index.scss'

const baseClass = 'collection-edit'

export const DefaultEditView: React.FC<DefaultEditViewProps> = async (props) => {
  const {
    id,
    action,
    apiURL,
    collectionConfig,
    customHeader,
    data,
    hasSavePermission,
    state,
    isEditing,
    // isLoading,
    // onSave: onSaveFromProps,
  } = props

  // const { auth } = collectionConfig

  const classes = [baseClass, isEditing && `${baseClass}--is-editing`].filter(Boolean).join(' ')

  // const onSave = useCallback(
  //   async (json) => {
  //     reportUpdate({
  //       id,
  //       entitySlug: collectionConfig.slug,
  //       updatedAt: json?.result?.updatedAt || new Date().toISOString(),
  //     })
  //     if (auth && id === user.id) {
  //       await refreshCookieAsync()
  //     }

  //     if (typeof onSaveFromProps === 'function') {
  //       onSaveFromProps({
  //         ...json,
  //         operation: id ? 'update' : 'create',
  //       })
  //     }
  //   },
  //   [id, onSaveFromProps, auth, user, refreshCookieAsync, collectionConfig, reportUpdate],
  // )

  const operation = isEditing ? 'update' : 'create'

  // useEffect(() => {
  //   const path = location.pathname

  //   if (!(path.endsWith(id) || path.endsWith('/create'))) {
  //     return
  //   }
  //   const editConfig = collectionConfig?.admin?.components?.views?.Edit
  //   const defaultActions =
  //     editConfig && 'Default' in editConfig && 'actions' in editConfig.Default
  //       ? editConfig.Default.actions
  //       : []

  //   setViewActions(defaultActions)
  // }, [id, location.pathname, collectionConfig?.admin?.components?.views?.Edit, setViewActions])

  return (
    <main className={classes}>
      <OperationProvider operation={operation}>
        <Form
          action={action}
          className={`${baseClass}__form`}
          disabled={!hasSavePermission}
          initialState={state}
          method={id ? 'PATCH' : 'POST'}
          // onSuccess={onSave}
        >
          <FormLoadingOverlayToggle
            action={operation}
            // formIsLoading={isLoading}
            // loadingSuffix={getTranslation(collectionConfig.labels.singular, i18n)}
            name={`collection-edit--${
              typeof collectionConfig?.labels?.singular === 'string'
                ? collectionConfig.labels.singular
                : 'document'
            }`}
            type="withoutNav"
          />
          <RenderCustomView {...props} view="Default" />
        </Form>
      </OperationProvider>
    </main>
  )
}
