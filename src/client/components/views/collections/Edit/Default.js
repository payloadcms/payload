import React from 'react';
import PropTypes from 'prop-types';
import { Link, useRouteMatch, useLocation } from 'react-router-dom';
import moment from 'moment';
import config from 'payload/config';
import Eyebrow from '../../../elements/Eyebrow';
import Form from '../../../forms/Form';
import PreviewButton from '../../../elements/PreviewButton';
import FormSubmit from '../../../forms/Submit';
import RenderFields from '../../../forms/RenderFields';
import CopyToClipboard from '../../../elements/CopyToClipboard';
import DuplicateDocument from '../../../elements/DuplicateDocument';
import DeleteDocument from '../../../elements/DeleteDocument';
import * as fieldTypes from '../../../forms/field-types';

import './index.scss';

const { serverURL, routes: { api, admin } } = config;

const baseClass = 'collection-edit';

const DefaultEditView = (props) => {
  const { params: { id } = {} } = useRouteMatch();
  const { state: locationState } = useLocation();

  const {
    collection, isEditing, data, onSave,
  } = props;

  const {
    slug,
    fields,
    useAsTitle,
    timestamps,
    preview,
  } = collection;

  const apiURL = `${serverURL}${api}/${slug}/${id}`;

  const dataToRender = locationState?.data || data;

  const classes = [
    baseClass,
    isEditing && `${baseClass}--is-editing`,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Form
        className={`${baseClass}__form`}
        method={id ? 'put' : 'post'}
        action={`${serverURL}${api}/${slug}${id ? `/${id}` : ''}`}
        handleAjaxResponse={onSave}
      >
        <div className={`${baseClass}__main`}>
          <Eyebrow />
          <div className={`${baseClass}__edit`}>
            <header className={`${baseClass}__header`}>
              <h1>
                {(data?.[useAsTitle || 'id'] ? data[useAsTitle || 'id'] : '[Untitled]')}
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
          {isEditing ? (
            <ul className={`${baseClass}__collection-actions`}>
              <li><Link to={`${admin}/collections/${slug}/create`}>Create New</Link></li>
              <li><DuplicateDocument slug={slug} /></li>
              <li>
                <DeleteDocument
                  collection={collection}
                  id={id}
                />
              </li>
            </ul>
          ) : undefined}
          <div className={`${baseClass}__document-actions${(preview && isEditing) ? ` ${baseClass}__document-actions--with-preview` : ''}`}>
            {isEditing && (
              <PreviewButton generatePreviewURL={preview} />
            )}
            <FormSubmit>Save</FormSubmit>
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
          {isEditing && (
            <ul className={`${baseClass}__meta`}>
              <li>
                <div className={`${baseClass}__label`}>ID</div>
                <div>{id}</div>
              </li>
              {timestamps && (
                <>
                  <li>
                    <div className={`${baseClass}__label`}>Last Modified</div>
                    <div>{moment(data.updatedAt).format('MMMM Do YYYY, h:mma')}</div>
                  </li>
                  <li>
                    <div className={`${baseClass}__label`}>Created</div>
                    <div>{moment(data.createdAt).format('MMMM Do YYYY, h:mma')}</div>
                  </li>
                </>
              )}

            </ul>
          )}
        </div>
      </Form>
    </div>
  );
};

DefaultEditView.defaultProps = {
  isEditing: false,
  data: undefined,
  onSave: null,
};

DefaultEditView.propTypes = {
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

export default DefaultEditView;
