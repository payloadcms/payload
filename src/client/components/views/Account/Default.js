import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import format from 'date-fns/format';
import config from 'payload/config';
import Eyebrow from '../../elements/Eyebrow';
import Form from '../../forms/Form';
import PreviewButton from '../../elements/PreviewButton';
import FormSubmit from '../../forms/Submit';
import RenderFields from '../../forms/RenderFields';
import CopyToClipboard from '../../elements/CopyToClipboard';
import * as fieldTypes from '../../forms/field-types';
import RenderTitle from '../../elements/RenderTitle';
import LeaveWithoutSaving from '../../modals/LeaveWithoutSaving';
import Auth from '../collections/Edit/Auth';
import Loading from '../../elements/Loading';

import './index.scss';

const { serverURL, routes: { api, admin } } = config;

const baseClass = 'account';

const DefaultAccount = (props) => {
  const {
    collection,
    data,
    permissions,
    hasSavePermission,
    apiURL,
    initialState,
    isLoading,
  } = props;

  const {
    slug,
    fields,
    admin: {
      useAsTitle,
    },
    timestamps,
    preview,
    auth,
  } = collection;

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Form
        className={`${baseClass}__form`}
        method="put"
        action={`${serverURL}${api}/${slug}/${data?.id}`}
        initialState={initialState}
        disabled={!hasSavePermission}
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
                <Auth useAPIKey={auth.useAPIKey} />
                <RenderFields
                  operation="update"
                  permissions={permissions.fields}
                  readOnly={!hasSavePermission}
                  filter={(field) => (!field.position || field?.admin?.position !== 'sidebar')}
                  fieldTypes={fieldTypes}
                  fieldSchema={fields}
                  customComponentsPath={`${slug}.fields.`}
                />
              </React.Fragment>
            )}
          </div>
        </div>
        <div className={`${baseClass}__sidebar`}>
          <ul className={`${baseClass}__collection-actions`}>
            {(permissions?.create?.permission) && (
              <React.Fragment>
                <li><Link to={`${admin}/collections/${slug}/create`}>Create New</Link></li>
              </React.Fragment>
            )}
          </ul>
          <div className={`${baseClass}__document-actions${preview ? ` ${baseClass}__document-actions--with-preview` : ''}`}>
            <PreviewButton generatePreviewURL={preview} />
            {hasSavePermission && (
              <FormSubmit>Save</FormSubmit>
            )}
          </div>
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
          <div className={`${baseClass}__sidebar-fields`}>
            <RenderFields
              operation="update"
              permissions={permissions.fields}
              readOnly={!hasSavePermission}
              filter={(field) => field?.admin?.position === 'sidebar'}
              position="sidebar"
              fieldTypes={fieldTypes}
              fieldSchema={fields}
              customComponentsPath={`${slug}.fields.`}
            />
          </div>
          <ul className={`${baseClass}__meta`}>
            <li>
              <div className={`${baseClass}__label`}>ID</div>
              <div>{data?.id}</div>
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
        </div>
      </Form>
    </div>
  );
};

DefaultAccount.defaultProps = {
  isEditing: false,
  data: undefined,
  onSave: null,
};

DefaultAccount.propTypes = {
  hasSavePermission: PropTypes.bool.isRequired,
  apiURL: PropTypes.string.isRequired,
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
      singular: PropTypes.string,
    }),
    slug: PropTypes.string,
    admin: PropTypes.shape({
      useAsTitle: PropTypes.string,
    }),
    fields: PropTypes.arrayOf(PropTypes.shape({})),
    preview: PropTypes.func,
    timestamps: PropTypes.bool,
    auth: PropTypes.shape({
      useAPIKey: PropTypes.bool,
    }),
  }).isRequired,
  isEditing: PropTypes.bool,
  data: PropTypes.shape({
    updatedAt: PropTypes.string,
    createdAt: PropTypes.string,
    id: PropTypes.string,
  }),
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
  onSave: PropTypes.func,
  initialState: PropTypes.shape({}).isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default DefaultAccount;
