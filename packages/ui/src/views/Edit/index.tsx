'use client'
import React, { Fragment, useCallback } from 'react'

import { FormLoadingOverlayToggle } from '../../elements/Loading'
import Form from '../../forms/Form'
import { OperationProvider } from '../../providers/OperationProvider'

// import { getTranslation } from '@payloadcms/translations'
import { DocumentControls } from '../../elements/DocumentControls'
import { DocumentFields } from '../../elements/DocumentFields'
import { LeaveWithoutSaving } from '../../elements/LeaveWithoutSaving'
import Auth from './Auth'
import { SetStepNav } from './SetStepNav'
import { Upload } from './Upload'
import { useConfig } from '../../providers/Config'
import { useComponentMap } from '../../providers/ComponentMapProvider'
import { SetDocumentTitle } from './SetDocumentTitle'
import { Props as FormProps } from '../../forms/Form/types'
import { getFormState } from '../../utilities/getFormState'
import { FieldPathProvider } from '../../forms/FieldPathProvider'
import { useDocumentInfo } from '../../providers/DocumentInfo'
import { useAuth } from '../../providers/Auth'

import './index.scss'

const baseClass = 'collection-edit'

// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered
export const DefaultEditView: React.FC = () => {
  const {
    action,
    BeforeDocument,
    AfterDocument,
    BeforeFields,
    AfterFields,
    apiURL,
    initialState,
    initialData: data,
    docPermissions,
    docPreferences,
    onSave: onSaveFromProps,
    id,
    hasSavePermission,
    disableActions,
    collectionSlug,
    globalSlug,
    disableLeaveWithoutSaving,
  } = useDocumentInfo()

  const { user } = useAuth()

  const config = useConfig()

  const {
    serverURL,
    collections,
    globals,
    routes: { api: apiRoute },
  } = config

  const { getFieldMap } = useComponentMap()

  const collectionConfig =
    collectionSlug && collections.find((collection) => collection.slug === collectionSlug)

  const globalConfig = globalSlug && globals.find((global) => global.slug === globalSlug)

  const [schemaPath] = React.useState(collectionConfig?.slug || globalConfig?.slug)

  const fieldMap = getFieldMap({
    collectionSlug: collectionConfig?.slug,
    globalSlug: globalConfig?.slug,
  })

  const isEditing = 'isEditing' in props ? props.isEditing : undefined
  const operation = id ? 'update' : 'create'

  const auth = collectionConfig ? collectionConfig.auth : undefined
  const upload = collectionConfig ? collectionConfig.upload : undefined

  const preventLeaveWithoutSaving =
    (!(collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.autosave) ||
      !(globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave)) &&
    !disableLeaveWithoutSaving

  const classes = [baseClass, id && `${baseClass}--is-editing`].filter(Boolean).join(' ')

  const onSave = useCallback(
    async (json) => {
      // reportUpdate({
      //   id,
      //   entitySlug: collectionConfig.slug,
      //   updatedAt: json?.result?.updatedAt || new Date().toISOString(),
      // })

      // if (auth && id === user.id) {
      //   await refreshCookieAsync()
      // }

      if (typeof onSaveFromProps === 'function') {
        onSaveFromProps({
          ...json,
          operation: id ? 'update' : 'create',
        })
      }
    },
    [
      id,
      onSaveFromProps,
      auth,
      user,
      // refreshCookieAsync,
      collectionConfig,
      //  reportUpdate
    ],
  )

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

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) =>
      getFormState({
        serverURL,
        apiRoute,
        body: {
          id,
          operation,
          formState: prevFormState,
          docPreferences,
          schemaPath,
        },
      }),
    [
      serverURL,
      apiRoute,
      collectionConfig,
      globalConfig,
      id,
      operation,
      docPreferences,
      schemaPath,
    ],
  )

  return (
    <main className={classes}>
      <FieldPathProvider path="" schemaPath={schemaPath}>
        <OperationProvider operation={operation}>
          <Form
            action={action}
            className={`${baseClass}__form`}
            disabled={!hasSavePermission}
            initialState={initialState}
            method={id ? 'PATCH' : 'POST'}
            onChange={[onChange]}
            onSuccess={onSave}
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
        description={`${isEditing ? t('general:editing') : t('general:creating')} - ${getTranslation(
          collection.labels.singular,
          i18n,
        )}`}
        keywords={`${getTranslation(collection.labels.singular, i18n)}, Payload, CMS`}
        title={`${isEditing ? t('general:editing') : t('general:creating')} - ${getTranslation(
          collection.labels.singular,
          i18n,
        )}`}
      /> */}
            {BeforeDocument}
            {preventLeaveWithoutSaving && <LeaveWithoutSaving />}
            <SetStepNav
              collectionSlug={collectionConfig?.slug}
              globalSlug={globalConfig?.slug}
              useAsTitle={collectionConfig?.admin?.useAsTitle}
              id={id}
              isEditing={isEditing || false}
              pluralLabel={collectionConfig?.labels?.plural}
            />
            <SetDocumentTitle
              config={config}
              collectionConfig={collectionConfig}
              globalConfig={globalConfig}
            />
            <DocumentControls
              apiURL={apiURL}
              slug={collectionConfig?.slug}
              data={data}
              disableActions={disableActions}
              hasSavePermission={hasSavePermission}
              id={id}
              isEditing={isEditing}
              permissions={docPermissions}
            />
            <DocumentFields
              BeforeFields={
                BeforeFields || (
                  <Fragment>
                    {auth && (
                      <Auth
                        className={`${baseClass}__auth`}
                        collectionSlug={collectionConfig.slug}
                        email={data?.email}
                        operation={operation}
                        readOnly={!hasSavePermission}
                        requirePassword={!Boolean(id)}
                        useAPIKey={auth.useAPIKey}
                        verify={auth.verify}
                      />
                    )}
                    {upload && (
                      <Upload
                        uploadConfig={upload}
                        collectionSlug={collectionConfig.slug}
                        initialState={initialState}
                      />
                    )}
                  </Fragment>
                )
              }
              fieldMap={fieldMap}
              AfterFields={AfterFields}
            />
            {AfterDocument}
          </Form>
        </OperationProvider>
      </FieldPathProvider>
    </main>
  )
}
