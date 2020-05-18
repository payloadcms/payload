import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import Logo from '../../graphics/Logo';
import MinimalTemplate from '../../templates/Minimal';
import StatusList, { useStatusList } from '../../elements/Status';
import Form from '../../forms/Form';
import Email from '../../forms/field-types/Email';
import Password from '../../forms/field-types/Password';
import FormSubmit from '../../forms/Submit';
import Button from '../../elements/Button';
import { useUser } from '../../data/User';

import './index.scss';

const baseClass = 'login';

const { admin: { user: userSlug }, serverURL, routes: { admin, api } } = PAYLOAD_CONFIG;

const Login = () => {
  const { addStatus } = useStatusList();
  const history = useHistory();
  const { user, setToken } = useUser();

  const handleAjaxResponse = (res) => {
    res.json()
      .then((data) => {
        if (data.token) {
          setToken(data.token);
          history.push(`${admin}`);
        } else {
          addStatus({
            type: 'error',
            message: 'The email address or password you have entered is invalid.',
          });
        }
      });
  };

  if (user) {
    return (
      <MinimalTemplate className={baseClass}>
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
      </MinimalTemplate>
    );
  }

  return (
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__brand`}>
        <Logo />
      </div>
      <StatusList />
      <Form
        handleAjaxResponse={handleAjaxResponse}
        method="POST"
        action={`${serverURL}${api}/${userSlug}/login`}
        redirect={admin}
      >
        <Email
          label="Email Address"
          name="email"
          autoComplete="email"
          required
        />
        <Password
          error="password"
          label="Password"
          name="password"
          required
        />
        <Link to={`${admin}/forgot`}>
          Forgot password?
        </Link>
        <FormSubmit>Login</FormSubmit>
      </Form>
    </MinimalTemplate>
  );
};

export default Login;
