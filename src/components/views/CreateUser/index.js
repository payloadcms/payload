import React from 'react';
import { ContentBlock, Form, Input, FormSubmit, SetStepNav } from 'payload/components';

import './index.css';

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
        <Input type="email" label="Email Address" name="email" required />
        <Input type="password" label="Password" name="password" required />
        <FormSubmit>Create</FormSubmit>
      </Form>
    </ContentBlock>
  );
};

export default CreateUser;
