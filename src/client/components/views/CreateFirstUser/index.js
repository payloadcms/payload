import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import StatusList, { useStatusList } from '../../modules/Status';
import ContentBlock from '../../layout/ContentBlock';
import Form from '../../forms/Form';
import RenderFields from '../../forms/RenderFields';
import * as fieldTypes from '../../forms/field-types';
import FormSubmit from '../../forms/Submit';
import config from '../../../securedConfig';
import { useUser } from '../../data/User';

import './index.scss';

const { serverURL, routes: { admin, api } } = config;

const passwordField = {
  name: 'password',
  label: 'Password',
  type: 'password',
  required: true,
};

const baseClass = 'create-first-user';

const CreateFirstUser = (props) => {
  const { setInitialized } = props;
  const { addStatus } = useStatusList();
  const { setToken } = useUser();
  const history = useHistory();

  const handleAjaxResponse = (res) => {
    res.json().then((data) => {
      if (data.token) {
        setToken(data.token);
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

  const fields = [...config.User.fields];

  if (config.User.auth.passwordIndex) {
    fields.splice(config.User.auth.passwordIndex, 0, passwordField);
  } else {
    fields.push(passwordField);
  }

  return (
    <ContentBlock
      className={baseClass}
      width="narrow"
    >
      <div className={`${baseClass}__wrap`}>
        <h1>Welcome to Payload</h1>
        <p>To begin, create your first user.</p>
        <StatusList />
        <Form
          handleAjaxResponse={handleAjaxResponse}
          disableSuccessStatus
          method="POST"
          action={`${serverURL}${api}/first-register`}
        >
          <RenderFields
            fieldSchema={fields}
            fieldTypes={fieldTypes}
          />
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
