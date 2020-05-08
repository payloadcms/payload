import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useRouteMatch, useHistory } from 'react-router-dom';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import { useStepNav } from '../../../elements/StepNav';
import Form from '../../../forms/Form';
import PreviewButton from '../../../elements/PreviewButton';
import FormSubmit from '../../../forms/Submit';
import RenderFields from '../../../forms/RenderFields';
import * as fieldTypes from '../../../forms/field-types';
import customComponents from '../../../customComponents';

import './index.scss';

const { serverURL, routes: { admin, api } } = PAYLOAD_CONFIG;

const baseClass = 'collection-edit';

const EditView = (props) => {
  const { params: { id } = {} } = useRouteMatch();
  const history = useHistory();
  const { setStepNav } = useStepNav();

  const { collection, isEditing } = props;
  const {
    slug,
    preview,
    fields,
    labels: {
      singular: singularLabel,
      plural: pluralLabel,
    },
    useAsTitle,
  } = collection;


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
    (isEditing ? `${serverURL}${api}/${slug}/${id}` : null),
    { initialParams: { 'fallback-locale': 'null' } },
  );

  const nav = [{
    url: `${admin}/collections/${slug}`,
    label: pluralLabel,
  }];

  if (isEditing) {
    nav.push({
      label: data ? data[useAsTitle] : '',
    });
  } else {
    nav.push({
      label: 'Create New',
    });
  }

  useEffect(() => {
    setStepNav(nav);
  }, [setStepNav, nav]);

  return (
    <div className={baseClass}>
      <header className={`${baseClass}__header`}>
        {isEditing && (
          <h1>
            Edit
            {' '}
            {Object.keys(data).length > 0
              && (data[useAsTitle] ? data[useAsTitle] : '[Untitled]')
            }
          </h1>
        )}
        {!isEditing
          && (
            <h1>
              Create New
              {' '}
              {singularLabel}
            </h1>
          )
        }
      </header>
      <Form
        className={`${baseClass}__form`}
        method={id ? 'put' : 'post'}
        action={`${serverURL}${api}/${slug}${id ? `/${id}` : ''}`}
        handleAjaxResponse={handleAjaxResponse}
      >
        {' '}
        <PreviewButton generatePreviewURL={preview} />
        <FormSubmit>Save</FormSubmit>
        <RenderFields
          fieldTypes={fieldTypes}
          customComponents={customComponents?.[slug]?.fields}
          fieldSchema={fields}
          initialData={data}
        />
      </Form>
    </div>
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
    preview: PropTypes.func,
  }).isRequired,
  isEditing: PropTypes.bool,
};

export default EditView;
