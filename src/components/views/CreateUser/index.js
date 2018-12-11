import React from 'react';
import { ContentBlock, Form, Email, Password, FormSubmit, SetStepNav } from 'payload/components';

import './index.scss';

const CreateUser = () => {

  return (
    <ContentBlock className="create-user" align="left" width="narrow">
      <SetStepNav nav={ [
        {
          label: 'Create User'
        }
      ] } />
      <h1>Create New User</h1>
      <Form
        method="POST"
        action="http://localhost:3000/users">
        <Email label="Email Address" name="email" required />
        <Password error="password" label="Password" name="password" required />
        <FormSubmit>Create</FormSubmit>
      </Form>
    </ContentBlock>
  );
};

export default CreateUser;
