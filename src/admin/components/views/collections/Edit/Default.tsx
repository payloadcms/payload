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
import Upload from './Upload';
import { Props } from './types';

import './index.scss';

const baseClass = 'collection-edit';

const DefaultEditView: React.FC<Props> = (props) => {
  const { params: { id } = {} } = useRouteMatch<Record<string, string>>();
  const { routes: { admin } } = useConfig();

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
  } = props;

  const {
    slug,
    fields,
    admin: {
      useAsTitle,
      disableDuplicate,
    },
    timestamps,
    preview,
    auth,
    upload,
  } = collection;

  const classes = [
    baseClass,
    isEditing && `${baseClass}--is-editing`,
  ].filter(Boolean).join(' ');

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
          <LeaveWithoutSaving />
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
                  />
                )}
                {upload && (
                  <Upload
                    data={data}
                    {...upload}
                    fieldTypes={fieldTypes}
                  />
                )}
                <RenderFields
                  operation={isEditing ? 'update' : 'create'}
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
        <div className={`${baseClass}__sidebar`}>
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
          <div className={`${baseClass}__sidebar-sticky`}>
            <div className={`${baseClass}__document-actions${(preview && isEditing) ? ` ${baseClass}__document-actions--with-preview` : ''}`}>
              {isEditing && (
                <PreviewButton generatePreviewURL={preview} />
              )}
              {hasSavePermission && (
                <FormSubmit>Save</FormSubmit>
              )}
            </div>
            {isEditing && (
              <div className={`${baseClass}__api-url`}>
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
              </div>
            )}
            {!isLoading && (
              <React.Fragment>
                <div className={`${baseClass}__sidebar-fields`}>
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
                    <li>
                      <div className={`${baseClass}__label`}>ID</div>
                      <div>{id}</div>
                    </li>
                    {timestamps && (
                      <React.Fragment>
                        {data.updatedAt && (
                          <li>
                            <div className={`${baseClass}__label`}>Last Modified</div>
                            <div>{format(new Date(data.updatedAt), 'MMMM do yyyy, h:mm a')}</div>
                          </li>
                        )}
                        {data.createdAt && (
                          <li>
                            <div className={`${baseClass}__label`}>Created</div>
                            <div>{format(new Date(data.createdAt), 'MMMM do yyyy, h:mm a')}</div>
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
      </Form>
    </div>
  );
};

export default DefaultEditView;
