import React from 'react';
import PropTypes from 'prop-types';
import { useRouteMatch, useHistory } from 'react-router-dom';
import config from '../../../../securedConfig';
import DefaultTemplate from '../../../layout/DefaultTemplate';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import Form from '../../../forms/Form';
import StickyHeader from '../../../modules/StickyHeader';
import APIURL from '../../../modules/APIURL';
import Button from '../../../controls/Button';
import FormSubmit from '../../../forms/Submit';
import RenderFields from '../../../forms/RenderFields';
import customComponents from '../../../customComponents';

import './index.scss';

const { serverURL, routes: { admin, api } } = config;

const baseClass = 'collection-edit';

const EditView = (props) => {
  const { collection, isEditing } = props;
  const { params: { id } = {} } = useRouteMatch();
  const history = useHistory();

  const handleAjaxResponse = !isEditing ? (res) => {
    res.json().then((json) => {
      history.push(`${admin}/collections/${collection.slug}/${json.doc.id}`, {
        status: {
          message: json.message,
          type: 'success',
        },
      });
    });
  } : null;

  const [{ data }] = usePayloadAPI(
    (isEditing ? `${serverURL}${api}/${collection.slug}/${id}` : null),
    { initialParams: { 'fallback-locale': 'null' } },
  );

  const nav = [{
    url: `${admin}/collections/${collection.slug}`,
    label: collection.labels.plural,
  }];

  if (isEditing) {
    nav.push({
      label: data ? data[collection.useAsTitle] : '',
    });
  } else {
    nav.push({
      label: 'Create New',
    });
  }

  return (
    <DefaultTemplate
      className={baseClass}
      stepNav={nav}
    >
      <header className={`${baseClass}__header`}>
        {isEditing && (
          <h1>
            Edit
            {' '}
            {Object.keys(data).length > 0
              && (data[collection.useAsTitle] ? data[collection.useAsTitle] : '[Untitled]')
            }
          </h1>
        )}
        {!isEditing
          && (
            <h1>
              Create New
              {' '}
              {collection.labels.singular}
            </h1>
          )
        }
      </header>
      <Form
        className={`${baseClass}__form`}
        method={id ? 'put' : 'post'}
        action={`${serverURL}${api}/${collection.slug}${id ? `/${id}` : ''}`}
        handleAjaxResponse={handleAjaxResponse}
      >
        <StickyHeader
          showStatus
          content={
            <APIURL url={isEditing && `${serverURL}${api}/${collection.slug}/${data.id}`} />
          }
          action={(
            <>
              <Button type="secondary">Preview</Button>
              <FormSubmit>Save</FormSubmit>
            </>
          )}
        />
        <RenderFields
          customComponents={customComponents?.[collection.slug]?.fields}
          fieldSchema={collection.fields}
          initialData={data}
        />
      </Form>
    </DefaultTemplate>
  );
};

EditView.defaultProps = {
  isEditing: false,
};

EditView.propTypes = {
  collection: PropTypes.shape({
    labels: PropTypes.shape({
      plural: PropTypes.string,
      singular: PropTypes.string,
    }),
    slug: PropTypes.string,
    useAsTitle: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape({})),
  }).isRequired,
  isEditing: PropTypes.bool,
};

export default EditView;
