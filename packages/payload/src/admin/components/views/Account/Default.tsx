import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { Translation } from '../../../../translations/type'
import type { CollectionEditViewProps } from '../types'

import { DocumentControls } from '../../elements/DocumentControls'
import { DocumentHeader } from '../../elements/DocumentHeader'
import { Gutter } from '../../elements/Gutter'
import { LoadingOverlayToggle } from '../../elements/Loading'
import ReactSelect from '../../elements/ReactSelect'
import Form from '../../forms/Form'
import Label from '../../forms/Label'
import RenderFields from '../../forms/RenderFields'
import { fieldTypes } from '../../forms/field-types'
import { LeaveWithoutSaving } from '../../modals/LeaveWithoutSaving'
import { useAuth } from '../../utilities/Auth'
import Meta from '../../utilities/Meta'
import { OperationContext } from '../../utilities/OperationProvider'
import Auth from '../collections/Edit/Auth'
import { ToggleTheme } from './ToggleTheme'
import './index.scss'

const baseClass = 'account'

const DefaultAccount: React.FC<CollectionEditViewProps> = (props) => {
  const {
    action,
    apiURL,
    collection,
    data,
    hasSavePermission,
    initialState,
    isLoading,
    onSave: onSaveFromProps,
    permissions,
  } = props

  const { auth, fields } = collection

  const { refreshCookieAsync } = useAuth()
  const { i18n, t } = useTranslation('authentication')

  const languageOptions = Object.entries(i18n.options.resources || {}).map(
    ([language, resource]) => ({
      label: (resource as Translation).general.thisLanguage,
      value: language,
    }),
  )

  const onSave = useCallback(async () => {
    await refreshCookieAsync()
    if (typeof onSaveFromProps === 'function') {
      onSaveFromProps({})
    }
  }, [onSaveFromProps, refreshCookieAsync])

  const classes = [baseClass].filter(Boolean).join(' ')

  return (
    <React.Fragment>
      <LoadingOverlayToggle name="account" show={isLoading} type="withoutNav" />
      {!isLoading && (
        <div className={classes}>
          <OperationContext.Provider value="update">
            <Form
              action={action}
              className={`${baseClass}__form`}
              disabled={!hasSavePermission}
              initialState={initialState}
              method="patch"
              onSuccess={onSave}
            >
              <DocumentHeader apiURL={apiURL} collection={collection} data={data} />
              <DocumentControls
                apiURL={apiURL}
                collection={collection}
                data={data}
                hasSavePermission={hasSavePermission}
                isAccountView
                permissions={permissions}
              />
              <div className={`${baseClass}__main`}>
                <Meta
                  description={t('accountOfCurrentUser')}
                  keywords={t('account')}
                  title={t('account')}
                />
                {!(collection.versions?.drafts && collection.versions?.drafts?.autosave) && (
                  <LeaveWithoutSaving />
                )}
                <div className={`${baseClass}__edit`}>
                  <Gutter className={`${baseClass}__header`}>
                    <Auth
                      className={`${baseClass}__auth`}
                      collection={collection}
                      email={data?.email}
                      operation="update"
                      readOnly={!hasSavePermission}
                      useAPIKey={auth.useAPIKey}
                    />
                    <RenderFields
                      fieldSchema={fields}
                      fieldTypes={fieldTypes}
                      filter={(field) => field?.admin?.position !== 'sidebar'}
                      permissions={permissions?.fields}
                      readOnly={!hasSavePermission}
                    />
                  </Gutter>
                  <Gutter className={`${baseClass}__payload-settings`}>
                    <h3>{t('general:payloadSettings')}</h3>
                    <div className={`${baseClass}__language`}>
                      <Label htmlFor="language-select" label={t('general:language')} />
                      <ReactSelect
                        inputId="language-select"
                        onChange={({ value }) => i18n.changeLanguage(value)}
                        options={languageOptions}
                        value={languageOptions.find((language) => language.value === i18n.language)}
                      />
                    </div>
                    <ToggleTheme />
                  </Gutter>
                </div>
              </div>
              <div className={`${baseClass}__sidebar-wrap`}>
                <div className={`${baseClass}__sidebar`}>
                  <div className={`${baseClass}__sidebar-sticky-wrap`}>
                    <div className={`${baseClass}__sidebar-fields`}>
                      <RenderFields
                        fieldSchema={fields}
                        fieldTypes={fieldTypes}
                        filter={(field) => field?.admin?.position === 'sidebar'}
                        permissions={permissions?.fields}
                        readOnly={!hasSavePermission}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          </OperationContext.Provider>
        </div>
      )}
    </React.Fragment>
  )
}

export default DefaultAccount
