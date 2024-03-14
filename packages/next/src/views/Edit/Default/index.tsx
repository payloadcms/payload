'use client'
import type { FormProps } from '@payloadcms/ui'

import {
  DocumentControls,
  DocumentFields,
  Form,
  FormLoadingOverlayToggle,
  OperationProvider,
  getFormState,
  useComponentMap,
  useConfig,
  useDocumentEvents,
  useDocumentInfo,
  useEditDepth,
} from '@payloadcms/ui'
import { Upload } from '@payloadcms/ui/elements'
import React, { Fragment, useCallback } from 'react'

import { LeaveWithoutSaving } from '../../../elements/LeaveWithoutSaving/index.js'
// import { getTranslation } from '@payloadcms/translations'
import Auth from './Auth/index.js'
import { SetDocumentTitle } from './SetDocumentTitle/index.js'
import { SetStepNav } from './SetStepNav/index.js'
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
    globalSlug,
    hasSavePermission,
    initialData: data,
    initialState,
    onSave: onSaveFromContext,
  } = useDocumentInfo()

  const config = useConfig()

  const {
    collections,
    globals,
    routes: { api: apiRoute },
    serverURL,
  } = config

  const { getComponentMap, getFieldMap } = useComponentMap()

  const depth = useEditDepth()

  const componentMap = getComponentMap({ collectionSlug, globalSlug })

  const collectionConfig =
    collectionSlug && collections.find((collection) => collection.slug === collectionSlug)

  const globalConfig = globalSlug && globals.find((global) => global.slug === globalSlug)

  const entitySlug = collectionConfig?.slug || globalConfig?.slug

  const fieldMap = getFieldMap({
    collectionSlug: collectionConfig?.slug,
    globalSlug: globalConfig?.slug,
  })

  const { reportUpdate } = useDocumentEvents()

  const operation = id ? 'update' : 'create'

  const auth = collectionConfig ? collectionConfig.auth : undefined
  const upload = collectionConfig ? collectionConfig.upload : undefined

  const preventLeaveWithoutSaving =
    (!(collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.autosave) ||
      !(globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave)) &&
    !disableLeaveWithoutSaving

  const classes = [baseClass, id && `${baseClass}--is-editing`].filter(Boolean).join(' ')

  const onSave = useCallback(
    (json) => {
      reportUpdate({
        id,
        entitySlug,
        updatedAt: json?.result?.updatedAt || new Date().toISOString(),
      })

      // if (auth && id === user.id) {
      //   await refreshCookieAsync()
      // }

      if (typeof onSaveFromContext === 'function') {
        void onSaveFromContext({
          ...json,
          operation: id ? 'update' : 'create',
        })
      }
    },
    [
      id,
      onSaveFromContext,
      // refreshCookieAsync,
      reportUpdate,
      entitySlug,
    ],
  )

  const onChange: FormProps['onChange'][0] = useCallback(
    ({ formState: prevFormState }) =>
      getFormState({
        apiRoute,
        body: {
          id,
          collectionSlug,
          formState: prevFormState,
          globalSlug,
          operation,
          schemaPath: entitySlug,
        },
        serverURL,
      }),
    [serverURL, apiRoute, id, operation, entitySlug, collectionSlug, globalSlug],
  )

  const RegisterGetThumbnailFunction = componentMap?.[`${collectionSlug}.adminThumbnail`]

  return (
    <main className={classes}>
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
          {BeforeDocument}
          {preventLeaveWithoutSaving && <LeaveWithoutSaving />}
          <SetStepNav
            collectionSlug={collectionConfig?.slug}
            globalSlug={globalConfig?.slug}
            id={id}
            pluralLabel={collectionConfig?.labels?.plural}
            useAsTitle={collectionConfig?.admin?.useAsTitle}
          />
          <SetDocumentTitle
            collectionConfig={collectionConfig}
            config={config}
            fallback={depth <= 1 ? id?.toString() : undefined}
            globalConfig={globalConfig}
          />
          <DocumentControls
            apiURL={apiURL}
            data={data}
            disableActions={disableActions}
            hasSavePermission={hasSavePermission}
            id={id}
            isEditing={Boolean(id)}
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
                    <React.Fragment>
                      {RegisterGetThumbnailFunction && <RegisterGetThumbnailFunction />}
                      <Upload
                        collectionSlug={collectionConfig.slug}
                        initialState={initialState}
                        uploadConfig={upload}
                      />
                    </React.Fragment>
                  )}
                </Fragment>
              )
            }
            docPermissions={docPermissions}
            fieldMap={fieldMap}
            readOnly={!hasSavePermission}
            schemaPath={entitySlug}
          />
          {AfterDocument}
        </Form>
      </OperationProvider>
    </main>
  )
}
