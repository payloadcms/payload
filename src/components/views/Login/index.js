import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { ContentBlock, Form, Input, FormSubmit } from 'payload/components';

import './index.css';

const mapStateToProps = state => ({
  windowHeight: state.common.windowHeight
})

const Login = props => {

  const Logo = props.logo;
  const minHeight = props.windowHeight;

  return (
    <ContentBlock className="login" width="narrow" style={{ minHeight }}>
      <div className="wrap">
        <Logo />
        <Form
          method="POST"
          action="http://localhost:3000/login">
          <Input type="email" label="Email Address" name="email" required />
          <Input type="password" label="Password" name="password" required />
          <FormSubmit>Login</FormSubmit>
        </Form>
        <Link to="/">To Dashboard</Link>
      </div>
    </ContentBlock>
  );
};

export default connect(mapStateToProps)(Login);
