import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { Props } from './types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import { formatDate } from '../../../../utilities/formatDate'
import Autosave from '../../../elements/Autosave'
import CopyToClipboard from '../../../elements/CopyToClipboard'
import DeleteDocument from '../../../elements/DeleteDocument'
import DuplicateDocument from '../../../elements/DuplicateDocument'
import Eyebrow from '../../../elements/Eyebrow'
import { Gutter } from '../../../elements/Gutter'
import { FormLoadingOverlayToggle } from '../../../elements/Loading'
import PreviewButton from '../../../elements/PreviewButton'
import { Publish } from '../../../elements/Publish'
import RenderTitle from '../../../elements/RenderTitle'
import { Save } from '../../../elements/Save'
import { SaveDraft } from '../../../elements/SaveDraft'
import Status from '../../../elements/Status'
import VersionsCount from '../../../elements/VersionsCount'
import Form from '../../../forms/Form'
import RenderFields from '../../../forms/RenderFields'
import fieldTypes from '../../../forms/field-types'
import LeaveWithoutSaving from '../../../modals/LeaveWithoutSaving'
import { useAuth } from '../../../utilities/Auth'
import { useConfig } from '../../../utilities/Config'
import { useDocumentInfo } from '../../../utilities/DocumentInfo'
import Meta from '../../../utilities/Meta'
import { OperationContext } from '../../../utilities/OperationProvider'
import Auth from './Auth'
import { SetStepNav } from './SetStepNav'
import Upload from './Upload'
import './index.scss'

const baseClass = 'collection-edit'

const DefaultEditView: React.FC<Props> = (props) => {
  const {
    admin: { dateFormat },
    routes: { admin },
  } = useConfig()
  const { publishedDoc } = useDocumentInfo()
  const { i18n, t } = useTranslation('general')
  const { refreshCookieAsync, user } = useAuth()

  const {
    action,
    apiURL,
    collection,
    customHeader,
    data,
    disableActions,
    disableEyebrow,
    disableLeaveWithoutSaving,
    hasSavePermission,
    id,
    internalState,
    isEditing,
    isLoading,
    onSave: onSaveFromProps,
    permissions,
    updatedAt,
  } = props

  const {
    admin: { disableDuplicate, hideAPIURL, preview, useAsTitle },
    auth,
    fields,
    slug,
    timestamps,
    upload,
    versions,
  } = collection

  const classes = [baseClass, isEditing && `${baseClass}--is-editing`].filter(Boolean).join(' ')

  const onSave = useCallback(
    async (json) => {
      if (auth && id === user.id) {
        await refreshCookieAsync()
      }

      if (typeof onSaveFromProps === 'function') {
        onSaveFromProps({
          ...json,
          operation: id ? 'update' : 'create',
        })
      }
    },
    [id, onSaveFromProps, auth, user, refreshCookieAsync],
  )

  const operation = isEditing ? 'update' : 'create'

  return (
    <React.Fragment>
      <div className={classes}>
        <OperationContext.Provider value={operation}>
          <Form
            action={action}
            className={`${baseClass}__form`}
            disabled={!hasSavePermission}
            initialState={internalState}
            method={id ? 'patch' : 'post'}
            onSuccess={onSave}
          >
            <FormLoadingOverlayToggle
              action={isLoading ? 'loading' : operation}
              formIsLoading={isLoading}
              loadingSuffix={getTranslation(collection.labels.singular, i18n)}
              name={`collection-edit--${collection.labels.singular}`}
              type="withoutNav"
            />

            {!isLoading && (
              <React.Fragment>
                {!disableEyebrow && (
                  <SetStepNav collection={collection} id={data?.id} isEditing={isEditing} />
                )}

                <div className={`${baseClass}__main`}>
                  <Meta
                    description={`${isEditing ? t('editing') : t('creating')} - ${getTranslation(
                      collection.labels.singular,
                      i18n,
                    )}`}
                    title={`${isEditing ? t('editing') : t('creating')} - ${getTranslation(
                      collection.labels.singular,
                      i18n,
                    )}`}
                    keywords={`${getTranslation(collection.labels.singular, i18n)}, Payload, CMS`}
                  />
                  {!disableEyebrow && <Eyebrow />}

                  {!(collection.versions?.drafts && collection.versions?.drafts?.autosave) &&
                    !disableLeaveWithoutSaving && <LeaveWithoutSaving />}

                  <Gutter className={`${baseClass}__edit`}>
                    <header className={`${baseClass}__header`}>
                      {customHeader && customHeader}
                      {!customHeader && (
                        <h1>
                          <RenderTitle
                            collection={collection}
                            data={data}
                            fallback={`[${t('untitled')}]`}
                            useAsTitle={useAsTitle}
                          />
                        </h1>
                      )}
                    </header>

                    {auth && (
                      <Auth
                        collection={collection}
                        email={data?.email}
                        operation={operation}
                        readOnly={!hasSavePermission}
                        requirePassword={!isEditing}
                        useAPIKey={auth.useAPIKey}
                        verify={auth.verify}
                      />
                    )}

                    {upload && (
                      <Upload collection={collection} data={data} internalState={internalState} />
                    )}

                    <RenderFields
                      filter={(field) =>
                        !field?.admin?.position || field?.admin?.position !== 'sidebar'
                      }
                      fieldSchema={fields}
                      fieldTypes={fieldTypes}
                      permissions={permissions.fields}
                      readOnly={!hasSavePermission}
                    />
                  </Gutter>
                </div>
                <div className={`${baseClass}__sidebar-wrap`}>
                  <div className={`${baseClass}__sidebar`}>
                    <div className={`${baseClass}__sidebar-sticky-wrap`}>
                      {!disableActions && (
                        <ul className={`${baseClass}__collection-actions`}>
                          {permissions?.create?.permission && (
                            <React.Fragment>
                              <li>
                                <Link id="action-create" to={`${admin}/collections/${slug}/create`}>
                                  {t('createNew')}
                                </Link>
                              </li>

                              {!disableDuplicate && isEditing && (
                                <li>
                                  <DuplicateDocument collection={collection} id={id} slug={slug} />
                                </li>
                              )}
                            </React.Fragment>
                          )}

                          {permissions?.delete?.permission && (
                            <li>
                              <DeleteDocument
                                buttonId="action-delete"
                                collection={collection}
                                id={id}
                              />
                            </li>
                          )}
                        </ul>
                      )}

                      <div
                        className={[
                          `${baseClass}__document-actions`,
                          ((collection.versions?.drafts &&
                            !collection.versions?.drafts?.autosave) ||
                            (isEditing && preview)) &&
                            `${baseClass}__document-actions--has-2`,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {isEditing &&
                          preview &&
                          (!collection.versions?.drafts ||
                            collection.versions?.drafts?.autosave) && (
                            <PreviewButton
                              CustomComponent={collection?.admin?.components?.edit?.PreviewButton}
                              generatePreviewURL={preview}
                            />
                          )}

                        {hasSavePermission && (
                          <React.Fragment>
                            {collection.versions?.drafts ? (
                              <React.Fragment>
                                {!collection.versions.drafts.autosave && (
                                  <SaveDraft
                                    CustomComponent={
                                      collection?.admin?.components?.edit?.SaveDraftButton
                                    }
                                  />
                                )}

                                <Publish
                                  CustomComponent={
                                    collection?.admin?.components?.edit?.PublishButton
                                  }
                                />
                              </React.Fragment>
                            ) : (
                              <Save
                                CustomComponent={collection?.admin?.components?.edit?.SaveButton}
                              />
                            )}
                          </React.Fragment>
                        )}
                      </div>

                      <div className={`${baseClass}__sidebar-fields`}>
                        {isEditing &&
                          preview &&
                          collection.versions?.drafts &&
                          !collection.versions?.drafts?.autosave && (
                            <PreviewButton
                              CustomComponent={collection?.admin?.components?.edit?.PreviewButton}
                              generatePreviewURL={preview}
                            />
                          )}

                        {collection.versions?.drafts && (
                          <React.Fragment>
                            <Status />
                            {collection.versions?.drafts.autosave && hasSavePermission && (
                              <Autosave
                                collection={collection}
                                id={id}
                                publishedDocUpdatedAt={publishedDoc?.updatedAt || data?.createdAt}
                              />
                            )}
                          </React.Fragment>
                        )}

                        <RenderFields
                          fieldSchema={fields}
                          fieldTypes={fieldTypes}
                          filter={(field) => field?.admin?.position === 'sidebar'}
                          permissions={permissions.fields}
                          readOnly={!hasSavePermission}
                        />
                      </div>

                      {isEditing && (
                        <ul className={`${baseClass}__meta`}>
                          {!hideAPIURL && (
                            <li className={`${baseClass}__api-url`}>
                              <span className={`${baseClass}__label`}>
                                API URL <CopyToClipboard value={apiURL} />
                              </span>
                              <a href={apiURL} rel="noopener noreferrer" target="_blank">
                                {apiURL}
                              </a>
                            </li>
                          )}

                          {versions && (
                            <li>
                              <div className={`${baseClass}__label`}>{t('version:versions')}</div>
                              <VersionsCount collection={collection} id={id} />
                            </li>
                          )}

                          {timestamps && (
                            <React.Fragment>
                              {updatedAt && (
                                <li>
                                  <div className={`${baseClass}__label`}>{t('lastModified')}</div>
                                  <div>
                                    {formatDate(data.updatedAt, dateFormat, i18n?.language)}
                                  </div>
                                </li>
                              )}
                              {(publishedDoc?.createdAt || data?.createdAt) && (
                                <li>
                                  <div className={`${baseClass}__label`}>{t('created')}</div>
                                  <div>
                                    {formatDate(
                                      publishedDoc?.createdAt || data?.createdAt,
                                      dateFormat,
                                      i18n?.language,
                                    )}
                                  </div>
                                </li>
                              )}
                            </React.Fragment>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )}
          </Form>
        </OperationContext.Provider>
      </div>
    </React.Fragment>
  )
}

export default DefaultEditView
