import React from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import format from 'date-fns/format';
import { useConfig } from '@payloadcms/config-provider';
import Eyebrow from '../../../elements/Eyebrow';
import Form from '../../../forms/Form';
import Loading from '../../../elements/Loading';
import PreviewButton from '../../../elements/PreviewButton';
import FormSubmit from '../../../forms/Submit';
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

import './index.scss';
import Status from '../../../elements/Status';
import Publish from '../../../elements/Publish';
import SaveDraft from '../../../elements/SaveDraft';
import { useDocumentInfo } from '../../../utilities/DocumentInfo';

const baseClass = 'collection-edit';

const DefaultEditView: React.FC<Props> = (props) => {
  const { params: { id } = {} } = useRouteMatch<Record<string, string>>();
  const { admin: { dateFormat }, routes: { admin } } = useConfig();
  const { publishedDoc } = useDocumentInfo();

  const {
    collection,
    isEditing,
    data,
    onSave,
    permissions,
    isLoading,
    initialState,
    apiURL,
    action,
    hasSavePermission,
    autosaveEnabled,
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
    <div className={classes}>
      <Form
        className={`${baseClass}__form`}
        method={id ? 'put' : 'post'}
        action={action}
        onSuccess={onSave}
        disabled={!hasSavePermission}
        initialState={initialState}
      >
        <div className={`${baseClass}__main`}>
          <Meta
            title={`${isEditing ? 'Editing' : 'Creating'} - ${collection.labels.singular}`}
            description={`${isEditing ? 'Editing' : 'Creating'} - ${collection.labels.singular}`}
            keywords={`${collection.labels.singular}, Payload, CMS`}
          />
          <Eyebrow />
          {!(collection.versions?.drafts && collection.versions?.drafts?.autosave) && (
            <LeaveWithoutSaving />
          )}
          <div className={`${baseClass}__edit`}>
            {isLoading && (
            <Loading />
            )}
            {!isLoading && (
            <React.Fragment>
              <header className={`${baseClass}__header`}>
                <h1>
                  <RenderTitle {...{ data, useAsTitle, fallback: '[Untitled]' }} />
                </h1>
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
                />
              )}
              <RenderFields
                operation={operation}
                readOnly={!hasSavePermission}
                permissions={permissions.fields}
                filter={(field) => (!field?.admin?.position || (field?.admin?.position !== 'sidebar'))}
                fieldTypes={fieldTypes}
                fieldSchema={fields}
              />
            </React.Fragment>
            )}
          </div>
        </div>
        <div className={`${baseClass}__sidebar-wrap`}>
          <div className={`${baseClass}__sidebar`}>
            <div className={`${baseClass}__sidebar-sticky-wrap`}>
              {isEditing ? (
                <ul className={`${baseClass}__collection-actions`}>
                  {(permissions?.create?.permission) && (
                    <React.Fragment>
                      <li><Link to={`${admin}/collections/${slug}/create`}>Create New</Link></li>
                      {!disableDuplicate && (
                      <li><DuplicateDocument slug={slug} /></li>
                      )}
                    </React.Fragment>
                  )}
                  {permissions?.delete?.permission && (
                    <li>
                      <DeleteDocument
                        collection={collection}
                        id={id}
                      />
                    </li>
              )}
                </ul>
              ) : undefined}
              <div className={`${baseClass}__document-actions${(autosaveEnabled || (isEditing && preview)) ? ` ${baseClass}__document-actions--has-2` : ''}`}>
                {(isEditing && preview && !autosaveEnabled) && (
                  <PreviewButton
                    generatePreviewURL={preview}
                    data={data}
                  />
                )}
                {hasSavePermission && (
                  <React.Fragment>
                    {collection.versions.drafts && (
                      <React.Fragment>
                        {!collection.versions.drafts.autosave && (
                          <SaveDraft />
                        )}
                        <Publish />
                      </React.Fragment>
                    )}
                    {!collection.versions.drafts && (
                      <FormSubmit>Save</FormSubmit>
                    )}
                  </React.Fragment>
                )}
              </div>
              {!isLoading && (
                <React.Fragment>
                  <div className={`${baseClass}__sidebar-fields`}>
                    {(isEditing && preview && autosaveEnabled) && (
                      <PreviewButton
                        generatePreviewURL={preview}
                        data={data}
                      />
                    )}
                    {collection.versions?.drafts && (
                      <React.Fragment>
                        <Status />
                        {(collection.versions.drafts.autosave && hasSavePermission) && (
                          <Autosave
                            publishedDocUpdatedAt={publishedDoc?.updatedAt}
                            collection={collection}
                            id={id}
                          />
                        )}
                      </React.Fragment>
                    )}
                    <RenderFields
                      operation={isEditing ? 'update' : 'create'}
                      readOnly={!hasSavePermission}
                      permissions={permissions.fields}
                      filter={(field) => field?.admin?.position === 'sidebar'}
                      fieldTypes={fieldTypes}
                      fieldSchema={fields}
                    />
                  </div>
                  {isEditing && (
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
                      <li>
                        <div className={`${baseClass}__label`}>ID</div>
                        <div>{id}</div>
                      </li>
                      {versions && (
                        <li>
                          <div className={`${baseClass}__label`}>Versions</div>
                          <VersionsCount
                            collection={collection}
                            id={id}
                          />
                        </li>
                      )}
                      {timestamps && (
                        <React.Fragment>
                          {data.updatedAt && (
                            <li>
                              <div className={`${baseClass}__label`}>Last Modified</div>
                              <div>{format(new Date(data.updatedAt), dateFormat)}</div>
                            </li>
                          )}
                          {publishedDoc?.createdAt && (
                            <li>
                              <div className={`${baseClass}__label`}>Created</div>
                              <div>{format(new Date(publishedDoc?.createdAt), dateFormat)}</div>
                            </li>
                          )}
                        </React.Fragment>
                      )}

                    </ul>
                  )}
                </React.Fragment>
              )}
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default DefaultEditView;
