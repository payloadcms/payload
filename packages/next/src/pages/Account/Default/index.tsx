import React from 'react'

import type { FieldTypes } from 'payload/config'

import {
  DocumentControls,
  DocumentFields,
  DocumentHeader,
  // LoadingOverlayToggle,
  Form,
  LeaveWithoutSaving,
  OperationProvider,
  Auth,
  EditViewProps,
} from '@payloadcms/ui'
import { Settings } from './Settings'
import './index.scss'

const baseClass = 'account'

export type DefaultAccountViewProps = EditViewProps & {
  fieldTypes: FieldTypes
}

export const DefaultAccount: React.FC<DefaultAccountViewProps> = (props) => {
  const {
    action,
    apiURL,
    config,
    data,
    fieldTypes,
    formState,
    onSave: onSaveFromProps,
    docPermissions,
    user,
    i18n,
  } = props

  const collectionConfig = 'collectionConfig' in props && props?.collectionConfig
  const hasSavePermission = 'hasSavePermission' in props && props?.hasSavePermission

  const { auth, fields } = collectionConfig

  // const { refreshCookieAsync } = useAuth()
  // const { t } = useTranslation('authentication')

  // const onSave = useCallback(
  //   async (json) => {
  //     await refreshCookieAsync()
  //     if (typeof onSaveFromProps === 'function') {
  //       onSaveFromProps(json)
  //     }
  //   },
  //   [onSaveFromProps, refreshCookieAsync],
  // )

  return (
    <React.Fragment>
      {/* <Meta description={t('accountOfCurrentUser')} keywords={t('account')} title={t('account')} /> */}
      {/* <LoadingOverlayToggle name="account" show={isLoading} type="withoutNav" /> */}
      <OperationProvider operation="update">
        <Form
          action={action}
          disabled={!hasSavePermission}
          initialState={formState}
          method="PATCH"
          // onSuccess={onSave}
        >
          {!(collectionConfig.versions?.drafts && collectionConfig.versions?.drafts?.autosave) && (
            <LeaveWithoutSaving />
          )}
          <DocumentHeader
            apiURL={apiURL}
            config={config}
            collectionConfig={collectionConfig}
            data={data}
            i18n={i18n}
          />
          <DocumentControls
            apiURL={apiURL}
            config={config}
            collectionConfig={collectionConfig}
            data={data}
            hasSavePermission={hasSavePermission}
            isAccountView
            permissions={docPermissions}
            i18n={i18n}
          />
          <DocumentFields
            AfterFields={<Settings className={`${baseClass}__settings`} />}
            BeforeFields={
              <Auth
                className={`${baseClass}__auth`}
                collectionSlug={collectionConfig.slug}
                email={data?.email}
                operation="update"
                readOnly={!hasSavePermission}
                useAPIKey={auth.useAPIKey}
              />
            }
            fieldTypes={fieldTypes}
            fields={fields}
            hasSavePermission={hasSavePermission}
            permissions={docPermissions}
            data={data}
            formState={formState}
            user={user}
          />
        </Form>
      </OperationProvider>
    </React.Fragment>
  )
}
