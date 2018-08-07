import React from 'react';
import { Link } from 'react-router-dom';
import ContentBlock from 'payload/client/components/layout/ContentBlock';
import Logo from 'local/client/components/graphics/Logo';
import Form from 'payload/client/components/forms/Form';
import Input from 'payload/client/components/forms/Input';
import Button from 'payload/client/components/controls/Button';

import './index.css';

export default () => {
  return (
    <ContentBlock className="login" width="narrow">
      <Logo />
      <Form
        method="POST"
        action="http://localhost:8080">
        <Input type="email" label="Email Address" name="email" required />
        <Input type="password" label="Password" name="password" required />
        <Button type="submit">
          Log In
        </Button>
      </Form>
      <Link to="/">To Dashboard</Link>
    </ContentBlock>
  );
};
