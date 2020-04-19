import React from 'react';
import PropTypes from 'prop-types';
import config from '../../../../securedConfig';
import DefaultTemplate from '../../../layout/DefaultTemplate';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import Form from '../../../forms/Form';
import StickyHeader from '../../../modules/StickyHeader';
import APIURL from '../../../modules/APIURL';
import Button from '../../../controls/Button';
import FormSubmit from '../../../forms/Submit';
import RenderFields from '../../../forms/RenderFields';
import * as fieldTypes from '../../../forms/field-types';

import './index.scss';

const {
  serverURL,
  routes: {
    admin,
    api,
  },
} = config;

const baseClass = 'global-edit';

const EditView = (props) => {
  const { global } = props;

  const [{ data }] = usePayloadAPI(
    `${serverURL}${api}/globals/${global.slug}`,
    { initialParams: { 'fallback-locale': 'null' } },
  );

  const nav = [{
    url: `${admin}/globals/${global.slug}`,
    label: global.label,
  }];

  return (
    <DefaultTemplate
      className={baseClass}
      stepNav={nav}
    >
      <header className={`${baseClass}__header`}>
        <h1>
          Edit
          {' '}
          {global.label}
        </h1>
      </header>
      <Form
        className={`${baseClass}__form`}
        method={data ? 'put' : 'post'}
        action={`${serverURL}${api}/globals/${global.slug}`}
      >
        <StickyHeader
          showStatus
          content={
            <APIURL url={`${serverURL}${api}/globals/${global.slug}`} />
          }
          action={(
            <>
              <Button type="secondary">Preview</Button>
              <FormSubmit>Save</FormSubmit>
            </>
          )}
        />
        <RenderFields
          fieldTypes={fieldTypes}
          fieldSchema={global.fields}
          initialData={data}
        />
      </Form>
    </DefaultTemplate>
  );
};

EditView.propTypes = {
  global: PropTypes.shape({
    label: PropTypes.string,
    slug: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape({})),
  }).isRequired,
};

export default EditView;
