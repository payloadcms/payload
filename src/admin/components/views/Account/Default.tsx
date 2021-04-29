import React from 'react';
import { Link } from 'react-router-dom';
import format from 'date-fns/format';
import { useConfig } from '@payloadcms/config-provider';
import Eyebrow from '../../elements/Eyebrow';
import Form from '../../forms/Form';
import PreviewButton from '../../elements/PreviewButton';
import FormSubmit from '../../forms/Submit';
import RenderFields from '../../forms/RenderFields';
import CopyToClipboard from '../../elements/CopyToClipboard';
import fieldTypes from '../../forms/field-types';
import RenderTitle from '../../elements/RenderTitle';
import LeaveWithoutSaving from '../../modals/LeaveWithoutSaving';
import Meta from '../../utilities/Meta';
import Auth from '../collections/Edit/Auth';
import Loading from '../../elements/Loading';
import { Props } from './types';

import './index.scss';

const baseClass = 'account';

const DefaultAccount: React.FC<Props> = (props) => {
  const {
    collection,
    data,
    permissions,
    hasSavePermission,
    apiURL,
    initialState,
    isLoading,
    action,
  } = props;

  const {
    slug,
    fields,
    admin: {
      useAsTitle,
      preview,
    },
    timestamps,
    auth,
  } = collection;

  const { admin: { dateFormat }, routes: { admin } } = useConfig();

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Form
        className={`${baseClass}__form`}
        method="put"
        action={action}
        initialState={initialState}
        disabled={!hasSavePermission}
      >
        <div className={`${baseClass}__main`}>
          <Meta
            title="Account"
            description="Account of current user"
            keywords="Account, Dashboard, Payload, CMS"
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
                <Auth
                  useAPIKey={auth.useAPIKey}
                  collection={collection}
                  email={data?.email}
                  operation="update"
                />
                <RenderFields
                  operation="update"
                  permissions={permissions.fields}
                  readOnly={!hasSavePermission}
                  filter={(field) => field?.admin?.position !== 'sidebar'}
                  fieldTypes={fieldTypes}
                  fieldSchema={fields}
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
            <PreviewButton
              generatePreviewURL={preview}
              data={data}
            />
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
              fieldTypes={fieldTypes}
              fieldSchema={fields}
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
                    <div>{format(new Date(data.updatedAt), dateFormat)}</div>
                  </li>
                )}
                {data.createdAt && (
                  <li>
                    <div className={`${baseClass}__label`}>Created</div>
                    <div>{format(new Date(data.createdAt), dateFormat)}</div>
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

export default DefaultAccount;
