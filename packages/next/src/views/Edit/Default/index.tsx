'use client'

import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload'

import {
  DocumentControls,
  DocumentFields,
  Form,
  type FormProps,
  OperationProvider,
  RenderComponent,
  Upload,
  useAuth,
  useConfig,
  useDocumentEvents,
  useDocumentInfo,
  useDrawerDepth,
  useUploadEdits,
} from '@payloadcms/ui'
import { formatAdminURL, getFormState } from '@payloadcms/ui/shared'
import { useRouter, useSearchParams } from 'next/navigation.js'
import React, { Fragment, useCallback, useState } from 'react'

import { LeaveWithoutSaving } from '../../../elements/LeaveWithoutSaving/index.js'
import { Auth } from './Auth/index.js'
import './index.scss'
import { SetDocumentStepNav } from './SetDocumentStepNav/index.js'
import { SetDocumentTitle } from './SetDocumentTitle/index.js'

const baseClass = 'collection-edit'

// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered
export const DefaultEditView: React.FC = () => {
  const {
    id,
    action,
    AfterDocument,
    AfterFields,
    apiURL,
    BeforeDocument,
    BeforeFields,
    collectionSlug,
    disableActions,
    disableLeaveWithoutSaving,
    docPermissions,
    getDocPreferences,
    getVersions,
    globalSlug,
    hasPublishPermission,
    hasSavePermission,
    initialData: data,
    initialState,
    isEditing,
    isInitializing,
    onSave: onSaveFromContext,
  } = useDocumentInfo()

  const { refreshCookieAsync, user } = useAuth()

  const {
    config,
    config: {
      admin: { user: userSlug },
      routes: { admin: adminRoute, api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const router = useRouter()
  const drawerDepth = useDrawerDepth()
  const params = useSearchParams()
  const { reportUpdate } = useDocumentEvents()
  const { resetUploadEdits } = useUploadEdits()

  const locale = params.get('locale')

  const collectionConfig = getEntityConfig({ collectionSlug }) as ClientCollectionConfig

  const globalConfig = getEntityConfig({ globalSlug }) as ClientGlobalConfig

  const entitySlug = collectionConfig?.slug || globalConfig?.slug

  const operation = collectionSlug && !id ? 'create' : 'update'

  const auth = collectionConfig ? collectionConfig.auth : undefined
  const upload = collectionConfig ? collectionConfig.upload : undefined

  const preventLeaveWithoutSaving =
    (!(collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.autosave) ||
      !(globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave)) &&
    !disableLeaveWithoutSaving

  const classes = [baseClass, id && `${baseClass}--is-editing`]

  if (globalSlug) {
    classes.push(`global-edit--${globalSlug}`)
  }
  if (collectionSlug) {
    classes.push(`collection-edit--${collectionSlug}`)
  }

  const [schemaPath, setSchemaPath] = React.useState(() => {
    if (operation === 'create' && auth && !auth.disableLocalStrategy) {
      return `_${entitySlug}.auth`
    }

    return entitySlug
  })
  const [validateBeforeSubmit, setValidateBeforeSubmit] = useState(() => {
    if (operation === 'create' && auth && !auth.disableLocalStrategy) {
      return true
    }

    return false
  })

  const onSave = useCallback(
    (json) => {
      reportUpdate({
        id,
        entitySlug,
        updatedAt: json?.result?.updatedAt || new Date().toISOString(),
      })

      // If we're editing the doc of the logged-in user,
      // Refresh the cookie to get new permissions
      if (user && collectionSlug === userSlug && id === user.id) {
        void refreshCookieAsync()
      }

      void getVersions()

      if (typeof onSaveFromContext === 'function') {
        void onSaveFromContext({
          ...json,
          operation: id ? 'update' : 'create',
        })
      }

      if (!isEditing && drawerDepth <= 1) {
        // Redirect to the same locale if it's been set
        const redirectRoute = formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}/${json?.doc?.id}${locale ? `?locale=${locale}` : ''}`,
        })
        router.push(redirectRoute)
      } else {
        resetUploadEdits()
      }
    },
    [
      onSaveFromContext,
      userSlug,
      reportUpdate,
      id,
      entitySlug,
      user,
      drawerDepth,
      collectionSlug,
      getVersions,
      isEditing,
      refreshCookieAsync,
      adminRoute,
      router,
      locale,
      resetUploadEdits,
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
          schemaPath,
        },
        serverURL,
      })
    },
    [apiRoute, collectionSlug, schemaPath, getDocPreferences, globalSlug, id, operation, serverURL],
  )

  return (
    <main className={classes.filter(Boolean).join(' ')}>
      <OperationProvider operation={operation}>
        <Form
          action={action}
          className={`${baseClass}__form`}
          disabled={isInitializing || !hasSavePermission}
          disableValidationOnSubmit={!validateBeforeSubmit}
          initialState={!isInitializing && initialState}
          isInitializing={isInitializing}
          method={id ? 'PATCH' : 'POST'}
          onChange={[onChange]}
          onSuccess={onSave}
        >
          {BeforeDocument}
          {preventLeaveWithoutSaving && <LeaveWithoutSaving />}
          <SetDocumentStepNav
            collectionSlug={collectionConfig?.slug}
            globalSlug={globalConfig?.slug}
            id={id}
            pluralLabel={collectionConfig?.labels?.plural}
            useAsTitle={collectionConfig?.admin?.useAsTitle}
          />
          <SetDocumentTitle
            collectionConfig={collectionConfig}
            config={config}
            fallback={drawerDepth <= 1 ? id?.toString() : undefined}
            globalConfig={globalConfig}
          />
          <DocumentControls
            apiURL={apiURL}
            data={data}
            disableActions={disableActions}
            hasPublishPermission={hasPublishPermission}
            hasSavePermission={hasSavePermission}
            id={id}
            isEditing={isEditing}
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
                      disableLocalStrategy={collectionConfig.auth?.disableLocalStrategy}
                      email={data?.email}
                      loginWithUsername={auth?.loginWithUsername}
                      operation={operation}
                      readOnly={!hasSavePermission}
                      requirePassword={!id}
                      setSchemaPath={setSchemaPath}
                      setValidateBeforeSubmit={setValidateBeforeSubmit}
                      useAPIKey={auth.useAPIKey}
                      username={data?.username}
                      verify={auth.verify}
                    />
                  )}
                  {upload && (
                    <React.Fragment>
                      {collectionConfig?.admin?.components?.edit?.Upload ? (
                        <RenderComponent
                          mappedComponent={collectionConfig.admin.components.edit.Upload}
                        />
                      ) : (
                        <Upload
                          collectionSlug={collectionConfig.slug}
                          initialState={initialState}
                          uploadConfig={upload}
                        />
                      )}
                    </React.Fragment>
                  )}
                </Fragment>
              )
            }
            docPermissions={docPermissions}
            fields={(collectionConfig || globalConfig)?.fields}
            readOnly={!hasSavePermission}
            schemaPath={schemaPath}
          />
          {AfterDocument}
        </Form>
      </OperationProvider>
    </main>
  )
}
