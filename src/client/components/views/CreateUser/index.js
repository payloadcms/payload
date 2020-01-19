import React, { useEffect } from 'react';
import ContentBlock from '../../layout/ContentBlock';
import Form from '../../forms/Form';
import Email from '../../forms/field-types/Email';
import Password from '../../forms/field-types/Password';
import FormSubmit from '../../forms/Submit';
import { useStepNav } from '../../modules/StepNav';

import './index.scss';

const CreateUser = () => {
  const { setStepNav } = useStepNav();

  useEffect(() => {
    setStepNav([
      {
        label: 'Create User',
      },
    ]);
  }, []);

  return (
    <ContentBlock
      className="create-user"
      align="left"
      width="narrow"
    >
      <h1>Create New User</h1>
      <Form
        method="POST"
        action="http://localhost:3000/users"
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
        <FormSubmit>Create</FormSubmit>
      </Form>
    </ContentBlock>
  );
};

export default CreateUser;
