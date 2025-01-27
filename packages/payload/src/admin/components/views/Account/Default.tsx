import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { FieldTypes } from '../../forms/field-types'
import type { CollectionEditViewProps } from '../types'

import { DocumentControls } from '../../elements/DocumentControls'
import { DocumentFields } from '../../elements/DocumentFields'
import { DocumentHeader } from '../../elements/DocumentHeader'
import { LoadingOverlayToggle } from '../../elements/Loading'
import Form from '../../forms/Form'
import { LeaveWithoutSaving } from '../../modals/LeaveWithoutSaving'
import { useAuth } from '../../utilities/Auth'
import Meta from '../../utilities/Meta'
import { OperationContext } from '../../utilities/OperationProvider'
import Auth from '../collections/Edit/Auth'
import { Settings } from './Settings'
import './index.scss'

const baseClass = 'account'

export type DefaultAccountViewProps = CollectionEditViewProps & {
  fieldTypes: FieldTypes
}

const DefaultAccount: React.FC<DefaultAccountViewProps> = (props) => {
  const {
    action,
    apiURL,
    collection,
    data,
    fieldTypes,
    hasSavePermission,
    initialState,
    isLoading,
    onSave: onSaveFromProps,
    permissions,
  } = props

  const { auth, fields } = collection

  const { refreshCookieAsync } = useAuth()
  const { t } = useTranslation('authentication')

  const onSave = useCallback(
    async (json) => {
      await refreshCookieAsync()
      if (typeof onSaveFromProps === 'function') {
        onSaveFromProps(json)
      }
    },
    [onSaveFromProps, refreshCookieAsync],
  )

  return (
    <React.Fragment>
      <Meta description={t('accountOfCurrentUser')} keywords={t('account')} title={t('account')} />
      <LoadingOverlayToggle name="account" show={isLoading} type="withoutNav" />
      {!isLoading && (
        <OperationContext.Provider value="update">
          <Form
            action={action}
            disabled={!hasSavePermission}
            initialState={initialState}
            method="patch"
            onSuccess={onSave}
          >
            {!(collection.versions?.drafts && collection.versions?.drafts?.autosave) && (
              <LeaveWithoutSaving />
            )}
            <DocumentHeader apiURL={apiURL} collection={collection} data={data} />
            <DocumentControls
              apiURL={apiURL}
              collection={collection}
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
                  collection={collection}
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
        </OperationContext.Provider>
      )}
    </React.Fragment>
  )
}

export default DefaultAccount
