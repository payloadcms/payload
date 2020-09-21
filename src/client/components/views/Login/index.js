import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useConfig } from '../../providers/Config';
import Logo from '../../graphics/Logo';
import MinimalTemplate from '../../templates/Minimal';
import Form from '../../forms/Form';
import Email from '../../forms/field-types/Email';
import Password from '../../forms/field-types/Password';
import FormSubmit from '../../forms/Submit';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';
import { useAuthentication } from '../../providers/Authentication';

import './index.scss';

const baseClass = 'login';

const Login = () => {
  const history = useHistory();
  const { user, setToken } = useAuthentication();
  const { admin: { user: userSlug }, serverURL, routes: { admin, api } } = useConfig();

  const onSuccess = (data) => {
    if (data.token) {
      setToken(data.token);
      history.push(admin);
    }
  };

  if (user) {
    return (
      <MinimalTemplate className={baseClass}>
        <Meta
          title="Login"
          description="Login user"
          keywords="Login, Payload, CMS"
        />
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
            buttonStyle="secondary"
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
      <Meta
        title="Login"
        description="Login user"
        keywords="Login, Payload, CMS"
      />
      <div className={`${baseClass}__brand`}>
        <Logo />
      </div>
      <Form
        disableSuccessStatus
        onSuccess={onSuccess}
        method="POST"
        action={`${serverURL}${api}/${userSlug}/login`}
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
