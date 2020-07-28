import React from 'react';
import PropTypes from 'prop-types';
import { Link, useRouteMatch } from 'react-router-dom';
import format from 'date-fns/format';
import config from 'payload/config';
import Eyebrow from '../../../elements/Eyebrow';
import Form from '../../../forms/Form';
import Loading from '../../../elements/Loading';
import PreviewButton from '../../../elements/PreviewButton';
import FormSubmit from '../../../forms/Submit';
import RenderFields from '../../../forms/RenderFields';
import CopyToClipboard from '../../../elements/CopyToClipboard';
import DuplicateDocument from '../../../elements/DuplicateDocument';
import DeleteDocument from '../../../elements/DeleteDocument';
import * as fieldTypes from '../../../forms/field-types';
import RenderTitle from '../../../elements/RenderTitle';
import LeaveWithoutSaving from '../../../modals/LeaveWithoutSaving';
import Auth from './Auth';
import Upload from './Upload';

import './index.scss';

const { routes: { admin } } = config;

const baseClass = 'collection-edit';

const DefaultEditView = (props) => {
  const { params: { id } = {} } = useRouteMatch();

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
                  customComponentsPath={`${slug}.fields.`}
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
                    position="sidebar"
                    fieldTypes={fieldTypes}
                    fieldSchema={fields}
                    customComponentsPath={`${slug}.fields.`}
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
                            <div>{format(new Date(data.updatedAt), 'MMMM do yyyy, h:mma')}</div>
                          </li>
                        )}
                        {data.createdAt && (
                          <li>
                            <div className={`${baseClass}__label`}>Created</div>
                            <div>{format(new Date(data.createdAt), 'MMMM do yyyy, h:mma')}</div>
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

DefaultEditView.defaultProps = {
  isEditing: false,
  isLoading: true,
  data: undefined,
  initialState: undefined,
  apiURL: undefined,
};

DefaultEditView.propTypes = {
  hasSavePermission: PropTypes.bool.isRequired,
  action: PropTypes.string.isRequired,
  apiURL: PropTypes.string,
  isLoading: PropTypes.bool,
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
      singular: PropTypes.string,
    }),
    slug: PropTypes.string,
    admin: PropTypes.shape({
      useAsTitle: PropTypes.string,
      disableDuplicate: PropTypes.bool,
    }),
    fields: PropTypes.arrayOf(PropTypes.shape({})),
    preview: PropTypes.func,
    timestamps: PropTypes.bool,
    auth: PropTypes.shape({
      useAPIKey: PropTypes.bool,
    }),
    upload: PropTypes.shape({}),
  }).isRequired,
  isEditing: PropTypes.bool,
  data: PropTypes.shape({
    updatedAt: PropTypes.string,
    createdAt: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  permissions: PropTypes.shape({
    create: PropTypes.shape({
      permission: PropTypes.bool,
    }),
    update: PropTypes.shape({
      permission: PropTypes.bool,
    }),
    delete: PropTypes.shape({
      permission: PropTypes.bool,
    }),
    fields: PropTypes.shape({}),
  }).isRequired,
  initialState: PropTypes.shape({}),
};

export default DefaultEditView;
