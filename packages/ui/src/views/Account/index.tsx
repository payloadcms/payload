import React from 'react'

import type { FieldTypes } from '../../forms/field-types'
import type { CollectionEditViewProps } from '../types'

import { DocumentControls } from '../../elements/DocumentControls'
import { DocumentFields } from '../../elements/DocumentFields'
import { DocumentHeader } from '../../elements/DocumentHeader'
import { LoadingOverlayToggle } from '../../elements/Loading'
import Form from '../../forms/Form'
import { LeaveWithoutSaving } from '../../elements/LeaveWithoutSaving'
// import Meta from '../../utilities/Meta'
import { OperationProvider } from '../../providers/OperationProvider'
import Auth from '../Edit/Auth'
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
    initialState,
    onSave: onSaveFromProps,
    permissions,
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
          initialState={initialState}
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
          />
          <DocumentControls
            apiURL={apiURL}
            config={config}
            collectionConfig={collectionConfig}
            data={data}
            hasSavePermission={hasSavePermission}
            isAccountView
            permissions={permissions}
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
          />
        </Form>
      </OperationProvider>
    </React.Fragment>
  )
}
