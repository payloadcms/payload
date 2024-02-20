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
import { EditViewProps } from '../types'
import { Upload } from './Upload'
import { useConfig } from '../../providers/Config'
import { useComponentMap } from '../../providers/ComponentMapProvider'
import { SetDocumentTitle } from './SetDocumentTitle'
import { Props as FormProps, FormState } from '../../forms/Form/types'

import './index.scss'
import { BuildFormStateArgs } from '../..'
import { getFormState } from './getFormState'

const baseClass = 'collection-edit'

export const DefaultEditView: React.FC<EditViewProps> = (props) => {
  const {
    action,
    apiURL,
    BeforeDocument,
    AfterDocument,
    AfterFields,
    data,
    initialState,
    // isLoading,
    onSave: onSaveFromProps,
    docPermissions,
    docPreferences,
    user,
  } = props

  const config = useConfig()
  const {
    serverURL,
    collections,
    globals,
    routes: { api: apiRoute },
  } = config

  const { getFieldMap } = useComponentMap()

  const collectionConfig =
    'collectionSlug' in props &&
    collections.find((collection) => collection.slug === props.collectionSlug)

  const globalConfig =
    'globalSlug' in props && globals.find((global) => global.slug === props.globalSlug)

  const fieldMap = getFieldMap({
    collectionSlug: collectionConfig?.slug,
    globalSlug: globalConfig?.slug,
  })

  const id = 'id' in props ? props.id : undefined
  const isEditing = 'isEditing' in props ? props.isEditing : undefined
  const operation = isEditing ? 'update' : 'create'

  const auth = collectionConfig ? collectionConfig.auth : undefined
  const upload = collectionConfig ? collectionConfig.upload : undefined
  const hasSavePermission = 'hasSavePermission' in props ? props.hasSavePermission : undefined
  const disableActions = 'disableActions' in props ? props.disableActions : undefined

  const preventLeaveWithoutSaving =
    (!(collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.autosave) ||
      !(globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave)) &&
    !('disableLeaveWithoutSaving' in props && props.disableLeaveWithoutSaving)

  const classes = [baseClass, isEditing && `${baseClass}--is-editing`].filter(Boolean).join(' ')

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
        collectionSlug: collectionConfig?.slug,
        globalSlug: globalConfig?.slug,
        body: {
          id,
          operation,
          formState: prevFormState,
          docPreferences,
        },
      }),
    [serverURL, apiRoute, collectionConfig, globalConfig, id, operation, docPreferences],
  )

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
                {upload && (
                  <Upload
                    uploadConfig={upload}
                    collectionSlug={collectionConfig.slug}
                    initialState={initialState}
                  />
                )}
              </Fragment>
            }
            fieldMap={fieldMap}
            AfterFields={AfterFields}
          />
          {AfterDocument}
        </Form>
      </OperationProvider>
    </main>
  )
}
