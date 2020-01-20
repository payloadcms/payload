import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import StatusList, { useStatusList } from '../../modules/Status';
import ContentBlock from '../../layout/ContentBlock';
import Form from '../../forms/Form';
import Email from '../../forms/field-types/Email';
import Password from '../../forms/field-types/Password';
import FormSubmit from '../../forms/Submit';
import getSanitizedConfig from '../../../config/getSanitizedConfig';
import Button from '../../controls/Button';
import { useUser } from '../../data/User';

import './index.scss';

const baseClass = 'login';

const {
  routes: {
    admin,
  },
} = getSanitizedConfig();

const Login = () => {
  const { addStatus } = useStatusList();
  const history = useHistory();
  const { user, setToken } = useUser();

  const handleAjaxResponse = (res) => {
    res.json().then((data) => {
      if (data.token) {
        setToken(data.token);
        history.push(`${admin}`);
      } else {
        addStatus({
          type: 'error',
          message: 'The username or password you have entered is invalid.',
        });
      }
    });
  };

  if (user) {
    return (
      <ContentBlock
        className={baseClass}
        width="narrow"
      >
        <div className={`${baseClass}__wrap`}>
          <h1>Already logged in</h1>
          <p>
            To log in with another user, you should
            {' '}
            <Link to={`${admin}/logout`}>log out</Link>
            {' '}
            first.
          </p>
          <br />
          <Button
            el="link"
            type="secondary"
            to={admin}
          >
            Back to Dashboard
          </Button>
        </div>
      </ContentBlock>
    );
  }

  return (
    <ContentBlock
      className={baseClass}
      width="narrow"
    >
      <div className={`${baseClass}__wrap`}>
        <StatusList />
        <Form
          handleAjaxResponse={handleAjaxResponse}
          method="POST"
          action="http://localhost:3000/login"
          redirect={admin}
        >
          <Email
            label="Email Address"
            name="email"
            required
          />
          <Password
            error="password"
            label="Password"
            name="password"
            required
          />
          <FormSubmit>Login</FormSubmit>
        </Form>
      </div>
    </ContentBlock>
  );
};

export default Login;
