import React from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';
import config from 'payload/config';
import Eyebrow from '../../elements/Eyebrow';
import Form from '../../forms/Form';
import PreviewButton from '../../elements/PreviewButton';
import FormSubmit from '../../forms/Submit';
import RenderFields from '../../forms/RenderFields';
import CopyToClipboard from '../../elements/CopyToClipboard';
import * as fieldTypes from '../../forms/field-types';
import LeaveWithoutSaving from '../../modals/LeaveWithoutSaving';

import './index.scss';

const { serverURL, routes: { api } } = config;

const baseClass = 'global-edit';

const DefaultGlobalView = (props) => {
  const {
    global, data, onSave, permissions,
  } = props;

  const {
    slug,
    fields,
    preview,
    label,
  } = global;

  const apiURL = `${serverURL}${api}/globals/${slug}`;
  const action = `${serverURL}${api}/globals/${slug}`;
  const hasSavePermission = permissions?.update?.permission;

  return (
    <div className={baseClass}>
      <Form
        className={`${baseClass}__form`}
        method="post"
        action={action}
        onSuccess={onSave}
        disabled={!hasSavePermission}
      >
        <div className={`${baseClass}__main`}>
          <Eyebrow />
          <LeaveWithoutSaving />
          <div className={`${baseClass}__edit`}>
            <header className={`${baseClass}__header`}>
              <h1>
                Edit
                {' '}
                {label}
              </h1>
            </header>
            <RenderFields
              operation="update"
              readOnly={!hasSavePermission}
              permissions={permissions.fields}
              filter={field => (!field.position || (field.position && field.position !== 'sidebar'))}
              fieldTypes={fieldTypes}
              fieldSchema={fields}
              initialData={data}
              customComponentsPath={`${slug}.fields.`}
            />
          </div>
        </div>
        <div className={`${baseClass}__sidebar`}>
          <div className={`${baseClass}__document-actions${preview ? ` ${baseClass}__document-actions--with-preview` : ''}`}>
            <PreviewButton generatePreviewURL={preview} />
            {hasSavePermission && (
              <FormSubmit>Save</FormSubmit>
            )}
          </div>
          {data && (
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
          <div className={`${baseClass}__sidebar-fields`}>
            <RenderFields
              operation="update"
              readOnly={!hasSavePermission}
              permissions={permissions.fields}
              filter={field => field.position === 'sidebar'}
              position="sidebar"
              fieldTypes={fieldTypes}
              fieldSchema={fields}
              initialData={data}
              customComponentsPath={`${slug}.fields.`}
            />
          </div>
          {data && (
            <ul className={`${baseClass}__meta`}>
              {data.updatedAt && (
                <li>
                  <div className={`${baseClass}__label`}>Last Modified</div>
                  <div>{format(new Date(data.updatedAt), 'MMMM do yyyy, h:mma')}</div>
                </li>
              )}
            </ul>
          )}
        </div>
      </Form>
    </div>
  );
};

DefaultGlobalView.defaultProps = {
  data: undefined,
};

DefaultGlobalView.propTypes = {
  global: PropTypes.shape({
    label: PropTypes.string.isRequired,
    slug: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape({})),
    preview: PropTypes.func,
  }).isRequired,
  data: PropTypes.shape({
    updatedAt: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  permissions: PropTypes.shape({
    update: PropTypes.shape({
      permission: PropTypes.bool,
    }),
    fields: PropTypes.shape({}),
  }).isRequired,
};

export default DefaultGlobalView;
