import React from 'react'

import type { FieldTypes, CollectionEditViewProps } from '@payloadcms/ui'

import {
  DocumentControls,
  DocumentFields,
  DocumentHeader,
  // LoadingOverlayToggle,
  Form,
  LeaveWithoutSaving,
  OperationProvider,
  Auth,
} from '@payloadcms/ui'
import { Settings } from './Settings'
import './index.scss'

const baseClass = 'account'

export type DefaultAccountViewProps = CollectionEditViewProps & {
  fieldTypes: FieldTypes
}

export const DefaultAccount: React.FC<DefaultAccountViewProps> = (props) => {
  const {
    action,
    apiURL,
    config,
    collectionConfig,
    data,
    fieldTypes,
    hasSavePermission,
    state,
    onSave: onSaveFromProps,
    permissions,
    user,
    i18n,
  } = props

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
          initialState={state}
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
            permissions={permissions}
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
            permissions={permissions}
            data={data}
            state={state}
            user={user}
          />
        </Form>
      </OperationProvider>
    </React.Fragment>
  )
}
