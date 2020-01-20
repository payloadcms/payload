import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import Cookies from 'universal-cookie';
import config from 'payload-config';
import { useStatusList } from '../../modules/Status';
import ContentBlock from '../../layout/ContentBlock';
import Form from '../../forms/Form';
import RenderFields from '../../forms/RenderFields';
import FormSubmit from '../../forms/Submit';
import getSanitizedConfig from '../../../config/getSanitizedConfig';

import './index.scss';

const {
  routes: {
    admin,
  },
} = getSanitizedConfig();

const cookies = new Cookies();

const passwordField = {
  name: 'password',
  label: 'Password',
  type: 'password',
};

const baseClass = 'create-first-user';

const CreateFirstUser = (props) => {
  const { setInitialized } = props;
  const { addStatus } = useStatusList();
  const history = useHistory();
  const handleAjaxResponse = (res) => {
    res.json().then((data) => {
      if (data.token) {
        cookies.set('token', data.token, { path: '/' });
        setInitialized(true);
        history.push(`${admin}`);
      } else {
        addStatus({
          type: 'error',
          message: 'There was a problem creating your first user.',
        });
      }
    });
  };

  const fields = [...config.user.fields];

  if (config.user.passwordIndex) {
    fields.splice(config.user.passwordIndex, 0, passwordField);
  } else {
    fields.push(passwordField);
  }

  return (
    <ContentBlock className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <h1>Welcome to Payload</h1>
        <p>To begin, create your first user.</p>
        <Form
          handleAjaxResponse={handleAjaxResponse}
          method="POST"
          action="/first-register"
        >
          <RenderFields fields={fields} />
          <FormSubmit>Create</FormSubmit>
        </Form>
      </div>
    </ContentBlock>
  );
};

CreateFirstUser.propTypes = {
  setInitialized: PropTypes.func.isRequired,
};

export default CreateFirstUser;
