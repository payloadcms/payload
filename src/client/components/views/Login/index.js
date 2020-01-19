import React from 'react';
import Cookies from 'universal-cookie';
import { Link } from 'react-router-dom';
import ContentBlock from '../../layout/ContentBlock';
import Form from '../../forms/Form';
import Email from '../../forms/field-types/Email';
import Password from '../../forms/field-types/Password';
import FormSubmit from '../../forms/Submit';

import './index.scss';

const cookies = new Cookies();

const handleAjaxResponse = (res) => {
  cookies.set('token', res.token, { path: '/' });
};

const baseClass = 'login';

const Login = () => {
  return (
    <ContentBlock
      className={baseClass}
      width="narrow"
    >
      <div className={`${baseClass}__wrap`}>
        <Form
          handleAjaxResponse={handleAjaxResponse}
          method="POST"
          action="http://localhost:3000/login"
          redirect="/"
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
        <Link to="/">To Dashboard</Link>
      </div>
    </ContentBlock>
  );
};

export default Login;
