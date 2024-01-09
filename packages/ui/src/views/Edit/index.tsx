import React, { Fragment } from 'react'

import { FormLoadingOverlayToggle } from '../../elements/Loading'
import Form from '../../forms/Form'
import { OperationProvider } from '../../providers/OperationProvider'
import './index.scss'

// import { getTranslation } from 'payload/utilities'
import { DocumentControls } from '../../elements/DocumentControls'
import { DocumentFields } from '../../elements/DocumentFields'
import { LeaveWithoutSaving } from '../../elements/LeaveWithoutSaving'
// import Meta from '../../../../utilities/Meta'
import Auth from './Auth'
import { SetStepNav } from './SetStepNav'
// import { Upload } from '../Upload'
import './index.scss'
import { EditViewProps } from '../types'
import { fieldTypes } from '../../exports'

const baseClass = 'collection-edit'

export const DefaultEditView: React.FC<EditViewProps> = async (props) => {
  const {
    action,
    apiURL,
    config,
    // customHeader,
    data,
    state,
    // isLoading,
    // onSave: onSaveFromProps,
    docPermissions,
    user,
  } = props

  const collectionConfig = 'collectionConfig' in props ? props.collectionConfig : undefined
  const globalConfig = 'globalConfig' in props ? props.globalConfig : undefined
  const fields = collectionConfig?.fields || globalConfig?.fields || []
  const auth = collectionConfig ? collectionConfig.auth : undefined
  const id = 'id' in props ? props.id : undefined
  const hasSavePermission = 'hasSavePermission' in props ? props.hasSavePermission : undefined
  const isEditing = 'isEditing' in props ? props.isEditing : undefined
  const disableActions = 'disableActions' in props ? props.disableActions : undefined

  const preventLeaveWithoutSaving =
    (!(collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.autosave) ||
      !(globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave)) &&
    !('disableLeaveWithoutSaving' in props && props.disableLeaveWithoutSaving)

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

          {/* <Meta
        description={`${isEditing ? t('editing') : t('creating')} - ${getTranslation(
          collection.labels.singular,
          i18n,
        )}`}
        keywords={`${getTranslation(collection.labels.singular, i18n)}, Payload, CMS`}
        title={`${isEditing ? t('editing') : t('creating')} - ${getTranslation(
          collection.labels.singular,
          i18n,
        )}`}
      /> */}
          {preventLeaveWithoutSaving && <LeaveWithoutSaving />}
          <SetStepNav
            collectionSlug={collectionConfig?.slug}
            useAsTitle={collectionConfig?.admin?.useAsTitle}
            id={id}
            isEditing={isEditing || false}
            pluralLabel={collectionConfig?.labels?.plural}
          />
          <DocumentControls
            apiURL={apiURL}
            config={config}
            collectionConfig={collectionConfig}
            data={data}
            disableActions={disableActions}
            hasSavePermission={hasSavePermission}
            id={id}
            isEditing={isEditing}
            permissions={docPermissions}
          />
          <DocumentFields
            BeforeFields={
              <Fragment>
                {auth && (
                  <Auth
                    className={`${baseClass}__auth`}
                    collectionSlug={collectionConfig.slug}
                    email={data?.email}
                    operation={operation}
                    readOnly={!hasSavePermission}
                    requirePassword={!isEditing}
                    useAPIKey={auth.useAPIKey}
                    verify={auth.verify}
                  />
                )}
                {/* {upload && <Upload collection={collection} internalState={internalState} />} */}
              </Fragment>
            }
            fieldTypes={fieldTypes}
            fields={fields}
            hasSavePermission={hasSavePermission}
            permissions={docPermissions}
            data={data}
            state={state}
            user={user}
          />
        </Form>
      </OperationProvider>
    </main>
  )
}
