import React from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import format from 'date-fns/format';
import config from 'payload/config';
import Eyebrow from '../../elements/Eyebrow';
import Form from '../../forms/Form';
import PreviewButton from '../../elements/PreviewButton';
import FormSubmit from '../../forms/Submit';
import RenderFields from '../../forms/RenderFields';
import CopyToClipboard from '../../elements/CopyToClipboard';
import DuplicateDocument from '../../elements/DuplicateDocument';
import DeleteDocument from '../../elements/DeleteDocument';
import * as fieldTypes from '../../forms/field-types';
import RenderTitle from '../../elements/RenderTitle';
import LeaveWithoutSaving from '../../modals/LeaveWithoutSaving';

import './index.scss';

const { serverURL, routes: { api, admin } } = config;

const baseClass = 'account';

const DefaultAccount = (props) => {
  const { state: locationState } = useLocation();

  const {
    collection, data,
  } = props;

  const {
    slug,
    fields,
    useAsTitle,
    timestamps,
    preview,
  } = collection;

  const apiURL = `${serverURL}${api}/${slug}/${data?.id}`;

  const dataToRender = locationState?.data || data;

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Form
        className={`${baseClass}__form`}
        method="put"
        action={`${serverURL}${api}/${slug}/${data?.id}`}
      >
        <div className={`${baseClass}__main`}>
          <Eyebrow />
          <LeaveWithoutSaving />
          <div className={`${baseClass}__edit`}>
            <header className={`${baseClass}__header`}>
              <h1>
                <RenderTitle {...{ data, useAsTitle, fallback: '[Untitled]' }} />
              </h1>
            </header>
            <RenderFields
              filter={field => (!field.position || (field.position && field.position !== 'sidebar'))}
              fieldTypes={fieldTypes}
              fieldSchema={fields}
              initialData={dataToRender}
              customComponentsPath={`${slug}.fields.`}
            />
          </div>
        </div>
        <div className={`${baseClass}__sidebar`}>
          <ul className={`${baseClass}__collection-actions`}>
            <li><Link to={`${admin}/collections/${slug}/create`}>Create New</Link></li>
            <li><DuplicateDocument slug={slug} /></li>
            <li>
              <DeleteDocument
                collection={collection}
                id={data?.id}
              />
            </li>
          </ul>
          <div className={`${baseClass}__document-actions${preview ? ` ${baseClass}__document-actions--with-preview` : ''}`}>
            <PreviewButton generatePreviewURL={preview} />
            <FormSubmit>Save</FormSubmit>
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
              filter={field => field.position === 'sidebar'}
              position="sidebar"
              fieldTypes={fieldTypes}
              fieldSchema={fields}
              initialData={dataToRender}
              customComponentsPath={`${slug}.fields.`}
            />
          </div>
          <ul className={`${baseClass}__meta`}>
            <li>
              <div className={`${baseClass}__label`}>ID</div>
              <div>{data?.id}</div>
            </li>
            {timestamps && (
              <>
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
              </>
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
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
      singular: PropTypes.string,
    }),
    slug: PropTypes.string,
    useAsTitle: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape({})),
    preview: PropTypes.func,
    timestamps: PropTypes.bool,
  }).isRequired,
  isEditing: PropTypes.bool,
  data: PropTypes.shape({
    updatedAt: PropTypes.string,
    createdAt: PropTypes.string,
  }),
  onSave: PropTypes.func,
};

export default DefaultAccount;
