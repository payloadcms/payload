'use client'
import type { FormProps } from '@payloadcms/ui'
import type { LivePreviewConfig } from 'payload/config'
import type { Data } from 'payload/types'

import {
  DocumentControls,
  DocumentFields,
  Form,
  LoadingOverlay,
  OperationProvider,
  SetViewActions,
  getFormState,
  useComponentMap,
  useConfig,
  useDocumentInfo,
  useTranslation,
} from '@payloadcms/ui'
import React, { Fragment, useCallback } from 'react'

import { LeaveWithoutSaving } from '../../elements/LeaveWithoutSaving/index.js'
import { SetDocumentTitle } from '../Edit/Default/SetDocumentTitle/index.js'
import { SetStepNav } from '../Edit/Default/SetStepNav/index.js'
import { useLivePreviewContext } from './Context/context.js'
import { LivePreviewProvider } from './Context/index.js'
import { LivePreview } from './Preview/index.js'
import './index.scss'
import { usePopupWindow } from './usePopupWindow.js'

const baseClass = 'live-preview'

const PreviewView: React.FC = (props) => {
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

  const schemaPath = collectionSlug || globalSlug

  const fieldMap = getFieldMap({
    collectionSlug: collectionConfig?.slug,
    globalSlug: globalConfig?.slug,
  })

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
    ({ formState: prevFormState }) =>
      getFormState({
        apiRoute,
        body: {
          id,
          formState: prevFormState,
          operation,
          schemaPath,
        },
        serverURL,
      }),
    [serverURL, apiRoute, id, operation, schemaPath],
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
            (global && !(global.versions?.drafts && global.versions?.drafts?.autosave))) &&
            !disableLeaveWithoutSaving && <LeaveWithoutSaving />}
          <SetStepNav
            collectionSlug={collectionSlug}
            globalLabel={globalConfig?.label}
            globalSlug={globalSlug}
            id={id}
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
            data={data}
            disableActions={disableActions}
            hasSavePermission={hasSavePermission}
            id={id}
            isEditing={Boolean(id)}
            permissions={docPermissions}
            slug={collectionConfig?.slug}
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
                schemaPath={collectionSlug}
              />
              {AfterDocument}
            </div>
            <LivePreview {...props} />
          </div>
        </Form>
      </OperationProvider>
    </Fragment>
  )
}

export const LivePreviewClient: React.FC<{
  breakpoints: LivePreviewConfig['breakpoints']
  initialData: Data
  livePreviewConfig: LivePreviewConfig
  url: string
}> = (props) => {
  const { breakpoints, url } = props
  const { collectionSlug, globalSlug } = useDocumentInfo()

  const { isPopupOpen, openPopupWindow, popupRef } = usePopupWindow({
    eventType: 'payload-live-preview',
    url,
  })

  const { getComponentMap } = useComponentMap()

  const componentMap = getComponentMap({ collectionSlug, globalSlug })

  return (
    <Fragment>
      <SetViewActions actions={componentMap?.actionsMap?.Edit?.LivePreview} />
      <LivePreviewProvider
        breakpoints={breakpoints}
        isPopupOpen={isPopupOpen}
        openPopupWindow={openPopupWindow}
        popupRef={popupRef}
        url={url}
      >
        <PreviewView />
      </LivePreviewProvider>
    </Fragment>
  )
}
