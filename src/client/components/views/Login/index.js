import React from 'react';
import Cookies from 'universal-cookie';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import ContentBlock from '../../layout/ContentBlock';
import Form from '../../forms/Form';
import Email from '../../field-types/Email';
import Password from '../../field-types/Password';
import FormSubmit from '../../forms/Submit';

import './index.scss';

const mapStateToProps = state => ({
  windowHeight: state.common.windowHeight,
});

const cookies = new Cookies();

const handleAjaxResponse = (res) => {
  cookies.set('token', res.token, { path: '/' });
};

const Login = (props) => {
  const Logo = props.logo;
  const minHeight = props.windowHeight;

  return (
    <ContentBlock
      className="login"
      width="narrow"
      style={{ minHeight }}
    >
      <div className="wrap">
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

export default connect(mapStateToProps)(Login);
