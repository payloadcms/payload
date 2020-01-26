import React from 'react';
import PropTypes from 'prop-types';
import getSanitizedConfig from '../../../../config/getSanitizedConfig';
import DefaultTemplate from '../../../layout/DefaultTemplate';
import usePayloadAPI from '../../../../hooks/usePayloadAPI';
import Form from '../../../forms/Form';
import StickyHeader from '../../../modules/StickyHeader';
import APIURL from '../../../modules/APIURL';
import Button from '../../../controls/Button';
import FormSubmit from '../../../forms/Submit';
import RenderFields from '../../../forms/RenderFields';

import './index.scss';

const {
  serverURL,
  routes: {
    admin
  }
} = getSanitizedConfig();

const baseClass = 'global-edit';

const EditView = (props) => {
  const { global } = props;

  const [{ data }] = usePayloadAPI(
    `${serverURL}/globals/${global.slug}`,
    { initialParams: { 'fallback-locale': 'null' } }
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
          Edit {global.label}
        </h1>
      </header>
      <Form className={`${baseClass}__form`} method={data ? 'put' : 'post'} action={`${serverURL}/globals/${global.slug}`}>
        <StickyHeader showStatus={true}
          content={
            <APIURL url={`${serverURL}/globals/${global.slug}`} />
          } action={
            <>
              <Button type="secondary">Preview</Button>
              <FormSubmit>Save</FormSubmit>
            </>
          } />
        <RenderFields fields={global.fields} initialData={data} />
      </Form>
    </DefaultTemplate>
  );
};

EditView.propTypes = {
  global: PropTypes.shape({
    label: PropTypes.string,
    slug: PropTypes.string,
  }).isRequired,
};

export default EditView;
