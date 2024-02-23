'use client'
import React, { Fragment, useCallback } from 'react'

import type { Props as FormProps } from '../../forms/Form/types'

// import { getTranslation } from '@payloadcms/translations'
import { DocumentControls } from '../../elements/DocumentControls'
import { DocumentFields } from '../../elements/DocumentFields'
import { LeaveWithoutSaving } from '../../elements/LeaveWithoutSaving'
import { FormLoadingOverlayToggle } from '../../elements/Loading'
import { FieldPathProvider } from '../../forms/FieldPathProvider'
import Form from '../../forms/Form'
import { useComponentMap } from '../../providers/ComponentMapProvider'
import { useConfig } from '../../providers/Config'
import { useDocumentInfo } from '../../providers/DocumentInfo'
import { OperationProvider } from '../../providers/OperationProvider'
import { getFormState } from '../../utilities/getFormState'
import Auth from './Auth'
import { SetDocumentTitle } from './SetDocumentTitle'
import { SetStepNav } from './SetStepNav'
import { Upload } from './Upload'
import './index.scss'

const baseClass = 'collection-edit'

// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered
export const DefaultEditView: React.FC = () => {
  const {
    id,
    AfterDocument,
    AfterFields,
    BeforeDocument,
    BeforeFields,
    action,
    apiURL,
    collectionSlug,
    disableActions,
    disableLeaveWithoutSaving,
    docPermissions,
    docPreferences,
    globalSlug,
    hasSavePermission,
    initialData: data,
    initialState,
    onSave: onSaveFromProps,
  } = useDocumentInfo()

  const config = useConfig()

  const {
    collections,
    globals,
    routes: { api: apiRoute },
    serverURL,
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
      // refreshCookieAsync,
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
        apiRoute,
        body: {
          id,
          docPreferences,
          formState: prevFormState,
          operation,
          schemaPath,
        },
        serverURL,
      }),
    [serverURL, apiRoute, id, operation, docPreferences, schemaPath],
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
              id={id}
              isEditing={isEditing || false}
              pluralLabel={collectionConfig?.labels?.plural}
              useAsTitle={collectionConfig?.admin?.useAsTitle}
            />
            <SetDocumentTitle
              collectionConfig={collectionConfig}
              config={config}
              globalConfig={globalConfig}
            />
            <DocumentControls
              apiURL={apiURL}
              data={data}
              disableActions={disableActions}
              hasSavePermission={hasSavePermission}
              id={id}
              isEditing={isEditing}
              permissions={docPermissions}
              slug={collectionConfig?.slug}
            />
            <DocumentFields
              AfterFields={AfterFields}
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
                        requirePassword={!id}
                        useAPIKey={auth.useAPIKey}
                        verify={auth.verify}
                      />
                    )}
                    {upload && (
                      <Upload
                        collectionSlug={collectionConfig.slug}
                        initialState={initialState}
                        uploadConfig={upload}
                      />
                    )}
                  </Fragment>
                )
              }
              fieldMap={fieldMap}
            />
            {AfterDocument}
          </Form>
        </OperationProvider>
      </FieldPathProvider>
    </main>
  )
}
