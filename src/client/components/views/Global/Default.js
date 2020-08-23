import React from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';
import Eyebrow from '../../elements/Eyebrow';
import Form from '../../forms/Form';
import PreviewButton from '../../elements/PreviewButton';
import FormSubmit from '../../forms/Submit';
import RenderFields from '../../forms/RenderFields';
import CopyToClipboard from '../../elements/CopyToClipboard';
import Meta from '../../utilities/Meta';
import * as fieldTypes from '../../forms/field-types';
import LeaveWithoutSaving from '../../modals/LeaveWithoutSaving';

import './index.scss';

const baseClass = 'global-edit';

const DefaultGlobalView = (props) => {
  const {
    global, data, onSave, permissions, action, apiURL, initialState,
  } = props;

  const {
    slug,
    fields,
    preview,
    label,
  } = global;

  const hasSavePermission = permissions?.update?.permission;

  return (
    <div className={baseClass}>
      <Form
        className={`${baseClass}__form`}
        method="post"
        action={action}
        onSuccess={onSave}
        disabled={!hasSavePermission}
        initialState={initialState}
      >
        <div className={`${baseClass}__main`}>
          <Meta
            title={label}
            description={label}
            keywords={`${label}, Payload, CMS`}
          />
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
              filter={(field) => (!field.position || (field.position && field.position !== 'sidebar'))}
              fieldTypes={fieldTypes}
              fieldSchema={fields}
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
              filter={(field) => field.position === 'sidebar'}
              position="sidebar"
              fieldTypes={fieldTypes}
              fieldSchema={fields}
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
  action: PropTypes.string.isRequired,
  apiURL: PropTypes.string.isRequired,
  initialState: PropTypes.shape({}).isRequired,
};

export default DefaultGlobalView;
