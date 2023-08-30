import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { Translation } from '../../../../translations/type.js'
import type { Props } from './types.js'

import { formatDate } from '../../../utilities/formatDate/index.js'
import CopyToClipboard from '../../elements/CopyToClipboard/index.js'
import Eyebrow from '../../elements/Eyebrow/index.js'
import { Gutter } from '../../elements/Gutter/index.js'
import { LoadingOverlayToggle } from '../../elements/Loading/index.js'
import PreviewButton from '../../elements/PreviewButton/index.js'
import ReactSelect from '../../elements/ReactSelect/index.js'
import RenderTitle from '../../elements/RenderTitle/index.js'
import { Save } from '../../elements/Save/index.js'
import Form from '../../forms/Form/index.js'
import Label from '../../forms/Label/index.js'
import RenderFields from '../../forms/RenderFields/index.js'
import fieldTypes from '../../forms/field-types/index.js'
import LeaveWithoutSaving from '../../modals/LeaveWithoutSaving/index.js'
import { useAuth } from '../../utilities/Auth/index.js'
import { useConfig } from '../../utilities/Config/index.js'
import Meta from '../../utilities/Meta/index.js'
import { OperationContext } from '../../utilities/OperationProvider/index.js'
import Auth from '../collections/Edit/Auth/index.js'
import { ToggleTheme } from './ToggleTheme/index.js'
import './index.scss'

const baseClass = 'account'

const DefaultAccount: React.FC<Props> = (props) => {
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

  const {
    admin: { preview, useAsTitle },
    auth,
    fields,
    slug,
    timestamps,
  } = collection

  const { refreshCookieAsync } = useAuth()
  const {
    admin: { dateFormat },
    routes: { admin },
  } = useConfig()
  const { i18n, t } = useTranslation('authentication')

  const languageOptions = Object.entries(i18n.options.resources).map(([language, resource]) => ({
    label: (resource as Translation).general.thisLanguage,
    value: language,
  }))

  const onSave = useCallback(async () => {
    await refreshCookieAsync()
    if (typeof onSaveFromProps === 'function') {
      onSaveFromProps()
    }
  }, [onSaveFromProps, refreshCookieAsync])

  const classes = [baseClass].filter(Boolean).join(' ')

  return (
    <React.Fragment>
      <LoadingOverlayToggle name="account" show={isLoading} type="withoutNav" />
      <div className={classes}>
        {!isLoading && (
          <OperationContext.Provider value="update">
            <Form
              action={action}
              className={`${baseClass}__form`}
              disabled={!hasSavePermission}
              initialState={initialState}
              method="patch"
              onSuccess={onSave}
            >
              <div className={`${baseClass}__main`}>
                <Meta
                  description={t('accountOfCurrentUser')}
                  keywords={t('account')}
                  title={t('account')}
                />
                <Eyebrow />
                {!(collection.versions?.drafts && collection.versions?.drafts?.autosave) && (
                  <LeaveWithoutSaving />
                )}
                <div className={`${baseClass}__edit`}>
                  <Gutter className={`${baseClass}__header`}>
                    <h1>
                      <RenderTitle
                        collection={collection}
                        data={data}
                        fallback={`[${t('general:untitled')}]`}
                        useAsTitle={useAsTitle}
                      />
                    </h1>
                    <Auth
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
                      permissions={permissions.fields}
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
                    <ul className={`${baseClass}__collection-actions`}>
                      {permissions?.create?.permission && (
                        <React.Fragment>
                          <li>
                            <Link to={`${admin}/collections/${slug}/create`}>
                              {t('general:createNew')}
                            </Link>
                          </li>
                        </React.Fragment>
                      )}
                    </ul>
                    <div
                      className={`${baseClass}__document-actions${
                        preview ? ` ${baseClass}__document-actions--with-preview` : ''
                      }`}
                    >
                      {preview &&
                        (!collection.versions?.drafts || collection.versions?.drafts?.autosave) && (
                          <PreviewButton
                            CustomComponent={collection?.admin?.components?.edit?.PreviewButton}
                            generatePreviewURL={preview}
                          />
                        )}
                      {hasSavePermission && (
                        <Save CustomComponent={collection?.admin?.components?.edit?.SaveButton} />
                      )}
                    </div>
                    <div className={`${baseClass}__sidebar-fields`}>
                      <RenderFields
                        fieldSchema={fields}
                        fieldTypes={fieldTypes}
                        filter={(field) => field?.admin?.position === 'sidebar'}
                        permissions={permissions.fields}
                        readOnly={!hasSavePermission}
                      />
                    </div>
                    <ul className={`${baseClass}__meta`}>
                      <li className={`${baseClass}__api-url`}>
                        <span className={`${baseClass}__label`}>
                          API URL <CopyToClipboard value={apiURL} />
                        </span>
                        <a href={apiURL} rel="noopener noreferrer" target="_blank">
                          {apiURL}
                        </a>
                      </li>
                      <li>
                        <div className={`${baseClass}__label`}>ID</div>
                        <div>{data?.id}</div>
                      </li>
                      {timestamps && (
                        <React.Fragment>
                          {data.updatedAt && (
                            <li>
                              <div className={`${baseClass}__label`}>
                                {t('general:lastModified')}
                              </div>
                              <div>{formatDate(data.updatedAt, dateFormat, i18n?.language)}</div>
                            </li>
                          )}
                          {data.createdAt && (
                            <li>
                              <div className={`${baseClass}__label`}>{t('general:created')}</div>
                              <div>{formatDate(data.createdAt, dateFormat, i18n?.language)}</div>
                            </li>
                          )}
                        </React.Fragment>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </Form>
          </OperationContext.Provider>
        )}
      </div>
    </React.Fragment>
  )
}

export default DefaultAccount
