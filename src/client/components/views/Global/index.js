import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import config from 'payload/config';
import { useStepNav } from '../../elements/StepNav';
import usePayloadAPI from '../../../hooks/usePayloadAPI';
import Form from '../../forms/Form';
import RenderFields from '../../forms/RenderFields';
import * as fieldTypes from '../../forms/field-types';

const {
  serverURL,
  routes: {
    admin,
    api,
  },
} = config;

const baseClass = 'global-edit';

const Global = (props) => {
  const { global: { slug, label, fields } } = props;
  const { setStepNav } = useStepNav();

  const [{ data }] = usePayloadAPI(
    `${serverURL}${api}/globals/${slug}`,
    { initialParams: { 'fallback-locale': 'null' } },
  );

  useEffect(() => {
    setStepNav([{
      url: `${admin}/globals/${slug}`,
      label,
    }]);
  }, [setStepNav, slug, label]);

  return (
    <div className={baseClass}>
      <header className={`${baseClass}__header`}>
        <h1>
          Edit
          {' '}
          {label}
        </h1>
      </header>
      <Form
        className={`${baseClass}__form`}
        method={data ? 'put' : 'post'}
        action={`${serverURL}${api}/globals/${slug}`}
      >
        <RenderFields
          fieldTypes={fieldTypes}
          fieldSchema={fields}
          initialData={data}
        />
      </Form>
    </div>
  );
};

Global.propTypes = {
  global: PropTypes.shape({
    label: PropTypes.string,
    slug: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape({})),
  }).isRequired,
};

export default Global;
