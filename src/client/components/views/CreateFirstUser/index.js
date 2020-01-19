import React from 'react';
import Cookies from 'universal-cookie';
import config from 'payload-config';
import ContentBlock from '../../layout/ContentBlock';
import Form from '../../forms/Form';
import RenderFields from '../../forms/RenderFields';
import FormSubmit from '../../forms/Submit';

import './index.scss';

const cookies = new Cookies();

const handleAjaxResponse = (res) => {
  cookies.set('token', res.token, { path: '/' });
};

const baseClass = 'create-first-user';

const CreateFirstUser = () => {
  return (
    <ContentBlock className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <h1>Welcome to Payload</h1>
        <p>To begin, create your first user.</p>
        <Form
          handleAjaxResponse={handleAjaxResponse}
          method="POST"
          action="/first-user"
        >
          <RenderFields fields={config.user.fields} />
          <FormSubmit>Create</FormSubmit>
        </Form>
      </div>
    </ContentBlock>
  );
};

export default CreateFirstUser;
