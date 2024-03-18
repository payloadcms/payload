'use client'
import type { FormProps } from '@payloadcms/ui'

import {
  DocumentControls,
  DocumentFields,
  Form,
  FormLoadingOverlayToggle,
  OperationProvider,
  getFormState,
  useAuth,
  useComponentMap,
  useConfig,
  useDocumentEvents,
  useDocumentInfo,
  useEditDepth,
  useFormQueryParams,
} from '@payloadcms/ui'
import { Upload } from '@payloadcms/ui/elements'
import { useRouter } from 'next/navigation.js'
import { useSearchParams } from 'next/navigation.js'
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
    getDocPermissions,
    getDocPreferences,
    getVersions,
    globalSlug,
    hasSavePermission,
    initialData: data,
    initialState,
    isEditing,
  } = useDocumentInfo()

  const { refreshCookieAsync, user } = useAuth()
  const config = useConfig()
  const router = useRouter()
  const { dispatchFormQueryParams } = useFormQueryParams()
  const { getComponentMap, getFieldMap } = useComponentMap()
  const params = useSearchParams()
  const depth = useEditDepth()
  const { reportUpdate } = useDocumentEvents()

  const {
    collections,
    globals,
    routes: { admin: adminRoute, api: apiRoute },
    serverURL,
  } = config

  const locale = params.get('locale')

  const componentMap = getComponentMap({ collectionSlug, globalSlug })

  const collectionConfig =
    collectionSlug && collections.find((collection) => collection.slug === collectionSlug)

  const globalConfig = globalSlug && globals.find((global) => global.slug === globalSlug)

  const entitySlug = collectionConfig?.slug || globalConfig?.slug

  const fieldMap = getFieldMap({
    collectionSlug: collectionConfig?.slug,
    globalSlug: globalConfig?.slug,
  })

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

      // If we're editing the doc of the logged in user,
      // Refresh the cookie to get new permissions
      if (collectionSlug === user?.collection && id === user.id) {
        void refreshCookieAsync()
      }

      void getVersions()
      void getDocPermissions()

      if (!isEditing) {
        // Redirect to the same locale if it's been set
        const redirectRoute = `${adminRoute}/collections/${collectionSlug}/${json?.doc?.id}${locale ? `?locale=${locale}` : ''}`
        router.push(redirectRoute)
      } else {
        dispatchFormQueryParams({
          type: 'SET',
          params: {
            uploadEdits: null,
          },
        })
      }
    },
    [
      reportUpdate,
      id,
      entitySlug,
      collectionSlug,
      user?.collection,
      user.id,
      getVersions,
      getDocPermissions,
      isEditing,
      refreshCookieAsync,
      adminRoute,
      locale,
      router,
      dispatchFormQueryParams,
    ],
  )

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      const docPreferences = await getDocPreferences()

      return getFormState({
        apiRoute,
        body: {
          id,
          collectionSlug,
          docPreferences,
          formState: prevFormState,
          globalSlug,
          operation,
          schemaPath: entitySlug,
        },
        serverURL,
      })
    },
    [serverURL, apiRoute, id, operation, entitySlug, collectionSlug, globalSlug, getDocPreferences],
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
            slug={collectionConfig?.slug || globalConfig?.slug}
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
