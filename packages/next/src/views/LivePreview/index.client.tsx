'use client'
import type { FormProps } from '@payloadcms/ui/forms/Form'
import type { FieldMap } from '@payloadcms/ui/utilities/buildComponentMap'
import type { LivePreviewConfig } from 'payload/config'
import type { ClientCollectionConfig, ClientConfig, ClientGlobalConfig, Data } from 'payload/types'

import { DocumentControls } from '@payloadcms/ui/elements/DocumentControls'
import { DocumentFields } from '@payloadcms/ui/elements/DocumentFields'
import { LoadingOverlay } from '@payloadcms/ui/elements/Loading'
import { Form } from '@payloadcms/ui/forms/Form'
import { SetViewActions } from '@payloadcms/ui/providers/Actions'
import { useComponentMap } from '@payloadcms/ui/providers/ComponentMap'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useDocumentInfo } from '@payloadcms/ui/providers/DocumentInfo'
import { OperationProvider } from '@payloadcms/ui/providers/Operation'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { getFormState } from '@payloadcms/ui/utilities/getFormState'
import React, { Fragment, useCallback } from 'react'

import { LeaveWithoutSaving } from '../../elements/LeaveWithoutSaving/index.js'
import { SetDocumentStepNav } from '../Edit/Default/SetDocumentStepNav/index.js'
import { SetDocumentTitle } from '../Edit/Default/SetDocumentTitle/index.js'
import { useLivePreviewContext } from './Context/context.js'
import { LivePreviewProvider } from './Context/index.js'
import { LivePreview } from './Preview/index.js'
import './index.scss'
import { usePopupWindow } from './usePopupWindow.js'

const baseClass = 'live-preview'

type Props = {
  apiRoute: string
  collectionConfig?: ClientCollectionConfig
  config: ClientConfig
  fieldMap: FieldMap
  globalConfig?: ClientGlobalConfig
  schemaPath: string
  serverURL: string
}

const PreviewView: React.FC<Props> = ({
  apiRoute,
  collectionConfig,
  config,
  fieldMap,
  globalConfig,
  schemaPath,
  serverURL,
}) => {
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
    getDocPreferences,
    globalSlug,
    hasPublishPermission,
    hasSavePermission,
    initialData,
    initialState,
    isEditing,
    onSave: onSaveFromProps,
  } = useDocumentInfo()

  const operation = id ? 'update' : 'create'

  const { t } = useTranslation()
  const { previewWindowType } = useLivePreviewContext()

  const onSave = useCallback(
    (json) => {
      // reportUpdate({
      //   id,
      //   entitySlug: collectionConfig.slug,
      //   updatedAt: json?.result?.updatedAt || new Date().toISOString(),
      // })

      // if (auth && id === user.id) {
      //   await refreshCookieAsync()
      // }

      if (typeof onSaveFromProps === 'function') {
        void onSaveFromProps({
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

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      const docPreferences = await getDocPreferences()

      return getFormState({
        apiRoute,
        body: {
          id,
          docPreferences,
          formState: prevFormState,
          operation,
          schemaPath,
        },
        serverURL,
      })
    },
    [serverURL, apiRoute, id, operation, schemaPath, getDocPreferences],
  )

  // Allow the `DocumentInfoProvider` to hydrate
  if (!collectionSlug && !globalSlug) {
    return <LoadingOverlay />
  }

  return (
    <Fragment>
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
          {((collectionConfig &&
            !(collectionConfig.versions?.drafts && collectionConfig.versions?.drafts?.autosave)) ||
            (globalConfig &&
              !(globalConfig.versions?.drafts && globalConfig.versions?.drafts?.autosave))) &&
            !disableLeaveWithoutSaving && <LeaveWithoutSaving />}
          <SetDocumentStepNav
            collectionSlug={collectionSlug}
            globalLabel={globalConfig?.label}
            globalSlug={globalSlug}
            id={id}
            pluralLabel={collectionConfig ? collectionConfig?.labels?.plural : undefined}
            useAsTitle={collectionConfig ? collectionConfig?.admin?.useAsTitle : undefined}
            view={t('general:livePreview')}
          />
          <SetDocumentTitle
            collectionConfig={collectionConfig}
            config={config}
            fallback={id?.toString() || ''}
            globalConfig={globalConfig}
          />
          <DocumentControls
            apiURL={apiURL}
            data={initialData}
            disableActions={disableActions}
            hasPublishPermission={hasPublishPermission}
            hasSavePermission={hasSavePermission}
            id={id}
            isEditing={isEditing}
            permissions={docPermissions}
            slug={collectionConfig?.slug || globalConfig?.slug}
          />
          <div
            className={[baseClass, previewWindowType === 'popup' && `${baseClass}--detached`]
              .filter(Boolean)
              .join(' ')}
          >
            <div
              className={[
                `${baseClass}__main`,
                previewWindowType === 'popup' && `${baseClass}__main--popup-open`,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {BeforeDocument}
              <DocumentFields
                AfterFields={AfterFields}
                BeforeFields={BeforeFields}
                docPermissions={docPermissions}
                fieldMap={fieldMap}
                forceSidebarWrap
                readOnly={!hasSavePermission}
                schemaPath={collectionSlug || globalSlug}
              />
              {AfterDocument}
            </div>
            <LivePreview collectionSlug={collectionSlug} globalSlug={globalSlug} />
          </div>
        </Form>
      </OperationProvider>
    </Fragment>
  )
}

export const LivePreviewClient: React.FC<{
  breakpoints: LivePreviewConfig['breakpoints']
  initialData: Data
  url: string
}> = (props) => {
  const { breakpoints, url } = props
  const { collectionSlug, globalSlug } = useDocumentInfo()

  const config = useConfig()

  const { isPopupOpen, openPopupWindow, popupRef } = usePopupWindow({
    eventType: 'payload-live-preview',
    url,
  })

  const {
    collections,
    globals,
    routes: { api: apiRoute },
    serverURL,
  } = config

  const collectionConfig =
    collectionSlug && collections.find((collection) => collection.slug === collectionSlug)

  const globalConfig = globalSlug && globals.find((global) => global.slug === globalSlug)

  const schemaPath = collectionSlug || globalSlug

  const { getComponentMap } = useComponentMap()

  const componentMap = getComponentMap({ collectionSlug, globalSlug })

  const { getFieldMap } = useComponentMap()

  const fieldMap = getFieldMap({
    collectionSlug: collectionConfig?.slug,
    globalSlug: globalConfig?.slug,
  })

  return (
    <Fragment>
      <SetViewActions actions={componentMap?.actionsMap?.Edit?.LivePreview} />
      <LivePreviewProvider
        breakpoints={breakpoints}
        fieldSchema={collectionConfig?.fields || globalConfig?.fields}
        isPopupOpen={isPopupOpen}
        openPopupWindow={openPopupWindow}
        popupRef={popupRef}
        url={url}
      >
        <PreviewView
          apiRoute={apiRoute}
          collectionConfig={collectionConfig}
          config={config}
          fieldMap={fieldMap}
          globalConfig={globalConfig}
          schemaPath={schemaPath}
          serverURL={serverURL}
        />
      </LivePreviewProvider>
    </Fragment>
  )
}
