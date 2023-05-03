import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../utilities/Config';
import Eyebrow from '../../../elements/Eyebrow';
import Form from '../../../forms/Form';
import PreviewButton from '../../../elements/PreviewButton';
import RenderFields from '../../../forms/RenderFields';
import CopyToClipboard from '../../../elements/CopyToClipboard';
import DuplicateDocument from '../../../elements/DuplicateDocument';
import DeleteDocument from '../../../elements/DeleteDocument';
import Meta from '../../../utilities/Meta';
import fieldTypes from '../../../forms/field-types';
import RenderTitle from '../../../elements/RenderTitle';
import LeaveWithoutSaving from '../../../modals/LeaveWithoutSaving';
import Auth from './Auth';
import VersionsCount from '../../../elements/VersionsCount';
import Upload from './Upload';
import { Props } from './types';
import Autosave from '../../../elements/Autosave';
import Status from '../../../elements/Status';
import { Publish } from '../../../elements/Publish';
import { SaveDraft } from '../../../elements/SaveDraft';
import { Save } from '../../../elements/Save';
import { useDocumentInfo } from '../../../utilities/DocumentInfo';
import { OperationContext } from '../../../utilities/OperationProvider';
import { Gutter } from '../../../elements/Gutter';
import { getTranslation } from '../../../../../utilities/getTranslation';
import { SetStepNav } from './SetStepNav';
import { FormLoadingOverlayToggle } from '../../../elements/Loading';
import { formatDate } from '../../../../utilities/formatDate';

import './index.scss';

const baseClass = 'collection-edit';

const DefaultEditView: React.FC<Props> = (props) => {
  const { admin: { dateFormat }, routes: { admin } } = useConfig();
  const { publishedDoc } = useDocumentInfo();
  const { t, i18n } = useTranslation('general');

  const {
    collection,
    isEditing,
    data,
    onSave,
    permissions,
    isLoading,
    internalState,
    apiURL,
    action,
    hasSavePermission,
    disableEyebrow,
    disableActions,
    disableLeaveWithoutSaving,
    customHeader,
    id,
    updatedAt,
  } = props;

  const {
    slug,
    fields,
    admin: {
      useAsTitle,
      disableDuplicate,
      preview,
      hideAPIURL,
    },
    versions,
    timestamps,
    auth,
    upload,
  } = collection;

  const classes = [
    baseClass,
    isEditing && `${baseClass}--is-editing`,
  ].filter(Boolean).join(' ');

  const operation = isEditing ? 'update' : 'create';

  return (
    <React.Fragment>
      <div className={classes}>
        <OperationContext.Provider value={operation}>
          <Form
            className={`${baseClass}__form`}
            method={id ? 'patch' : 'post'}
            action={action}
            onSuccess={onSave}
            disabled={!hasSavePermission}
            initialState={internalState}
          >
            <FormLoadingOverlayToggle
              formIsLoading={isLoading}
              action={isLoading ? 'loading' : operation}
              name={`collection-edit--${collection.labels.singular}`}
              loadingSuffix={getTranslation(collection.labels.singular, i18n)}
              type="withoutNav"
            />

            {!isLoading && (
              <React.Fragment>
                {!disableEyebrow && (
                  <SetStepNav
                    collection={collection}
                    isEditing={isEditing}
                    id={data?.id}
                  />
                )}

                <div className={`${baseClass}__main`}>
                  <Meta
                    title={`${isEditing ? t('editing') : t('creating')} - ${getTranslation(collection.labels.singular, i18n)}`}
                    description={`${isEditing ? t('editing') : t('creating')} - ${getTranslation(collection.labels.singular, i18n)}`}
                    keywords={`${getTranslation(collection.labels.singular, i18n)}, Payload, CMS`}
                  />
                  {!disableEyebrow && (
                    <Eyebrow />
                  )}

                  {(!(collection.versions?.drafts && collection.versions?.drafts?.autosave) && !disableLeaveWithoutSaving) && (
                    <LeaveWithoutSaving />
                  )}

                  <Gutter className={`${baseClass}__edit`}>
                    <header className={`${baseClass}__header`}>
                      {customHeader && customHeader}
                      {!customHeader && (
                        <h1>
                          <RenderTitle
                            data={data}
                            collection={collection}
                            useAsTitle={useAsTitle}
                            fallback={`[${t('untitled')}]`}
                          />
                        </h1>
                      )}
                    </header>

                    {auth && (
                      <Auth
                        useAPIKey={auth.useAPIKey}
                        requirePassword={!isEditing}
                        verify={auth.verify}
                        collection={collection}
                        email={data?.email}
                        operation={operation}
                      />
                    )}

                    {upload && (
                      <Upload
                        data={data}
                        collection={collection}
                        internalState={internalState}
                      />
                    )}

                    <RenderFields
                      readOnly={!hasSavePermission}
                      permissions={permissions.fields}
                      filter={(field) => (!field?.admin?.position || (field?.admin?.position !== 'sidebar'))}
                      fieldTypes={fieldTypes}
                      fieldSchema={fields}
                    />
                  </Gutter>
                </div>
                <div className={`${baseClass}__sidebar-wrap`}>
                  <div className={`${baseClass}__sidebar`}>
                    <div className={`${baseClass}__sidebar-sticky-wrap`}>
                      {!disableActions && (
                        <ul className={`${baseClass}__collection-actions`}>
                          {(permissions?.create?.permission) && (
                            <React.Fragment>
                              <li>
                                <Link
                                  id="action-create"
                                  to={`${admin}/collections/${slug}/create`}
                                >
                                  {t('createNew')}
                                </Link>
                              </li>

                              {!disableDuplicate && isEditing && (
                                <li>
                                  <DuplicateDocument
                                    collection={collection}
                                    id={id}
                                    slug={slug}
                                  />
                                </li>
                              )}
                            </React.Fragment>
                          )}

                          {permissions?.delete?.permission && (
                            <li>
                              <DeleteDocument
                                collection={collection}
                                id={id}
                                buttonId="action-delete"
                              />
                            </li>
                          )}
                        </ul>
                      )}

                      <div
                        className={[
                          `${baseClass}__document-actions`,
                          ((collection.versions?.drafts && !collection.versions?.drafts?.autosave) || (isEditing && preview)) && `${baseClass}__document-actions--has-2`,
                        ].filter(Boolean).join(' ')}
                      >
                        {(isEditing && preview && (!collection.versions?.drafts || collection.versions?.drafts?.autosave)) && (
                          <PreviewButton
                            generatePreviewURL={preview}
                            CustomComponent={collection?.admin?.components?.elements?.PreviewButton}
                          />
                        )}

                        {hasSavePermission && (
                          <React.Fragment>
                            {collection.versions?.drafts ? (
                              <React.Fragment>
                                {!collection.versions.drafts.autosave && (
                                  <SaveDraft CustomComponent={collection?.admin?.components?.elements?.SaveDraftButton} />
                                )}

                                <Publish
                                  CustomComponent={collection?.admin?.components?.elements?.PublishButton}
                                />
                              </React.Fragment>
                            ) : (
                              <Save
                                CustomComponent={collection?.admin?.components?.elements?.SaveButton}
                              />
                            )}
                          </React.Fragment>
                        )}
                      </div>

                      <div className={`${baseClass}__sidebar-fields`}>
                        {(isEditing && preview && (collection.versions?.drafts && !collection.versions?.drafts?.autosave)) && (
                          <PreviewButton
                            generatePreviewURL={preview}
                            CustomComponent={collection?.admin?.components?.elements?.PreviewButton}
                          />
                        )}

                        {collection.versions?.drafts && (
                          <React.Fragment>
                            <Status />
                            {(collection.versions?.drafts.autosave && hasSavePermission) && (
                              <Autosave
                                publishedDocUpdatedAt={publishedDoc?.updatedAt || data?.createdAt}
                                collection={collection}
                                id={id}
                              />
                            )}
                          </React.Fragment>
                        )}

                        <RenderFields
                          readOnly={!hasSavePermission}
                          permissions={permissions.fields}
                          filter={(field) => field?.admin?.position === 'sidebar'}
                          fieldTypes={fieldTypes}
                          fieldSchema={fields}
                        />
                      </div>

                      {
                        isEditing && (
                          <ul className={`${baseClass}__meta`}>
                            {!hideAPIURL && (
                              <li className={`${baseClass}__api-url`}>
                                <span className={`${baseClass}__label`}>
                                  API URL
                                  {' '}
                                  <CopyToClipboard value={apiURL} />
                                </span>
                                <a
                                  href={apiURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {apiURL}
                                </a>
                              </li>
                            )}

                            {versions && (
                              <li>
                                <div className={`${baseClass}__label`}>{t('version:versions')}</div>
                                <VersionsCount
                                  collection={collection}
                                  id={id}
                                />
                              </li>
                            )}

                            {timestamps && (
                              <React.Fragment>
                                {updatedAt && (
                                  <li>
                                    <div className={`${baseClass}__label`}>{t('lastModified')}</div>
                                    <div>{formatDate(data.updatedAt, dateFormat, i18n?.language)}</div>
                                  </li>
                                )}
                                {(publishedDoc?.createdAt || data?.createdAt) && (
                                  <li>
                                    <div className={`${baseClass}__label`}>{t('created')}</div>
                                    <div>{formatDate(publishedDoc?.createdAt || data?.createdAt, dateFormat, i18n?.language)}</div>
                                  </li>
                                )}
                              </React.Fragment>
                            )}
                          </ul>
                        )
                      }
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )}
          </Form>
        </OperationContext.Provider>
      </div>
    </React.Fragment>
  );
};

export default DefaultEditView;
