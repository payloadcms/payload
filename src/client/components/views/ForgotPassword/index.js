import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MinimalTemplate from '../../templates/Minimal';
import StatusList, { useStatusList } from '../../elements/Status';
import Form from '../../forms/Form';
import Email from '../../forms/field-types/Email';
import FormSubmit from '../../forms/Submit';
import config from '../../../securedConfig';
import Button from '../../elements/Button';
import { useUser } from '../../data/User';

import './index.scss';

const baseClass = 'forgot-password';

const { serverURL, routes: { admin, api } } = config;

const ForgotPassword = () => {
  const { addStatus } = useStatusList();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { user } = useUser();

  const handleAjaxResponse = (res) => {
    res.json()
      .then(() => {
        setHasSubmitted(true);
      }, () => {
        addStatus({
          type: 'error',
          message: 'The email provided is not valid.',
        });
      });
  };

  if (user) {
    return (
      <MinimalTemplate className={baseClass}>
        <h1>You&apos;re already logged in</h1>
        <p>
          To change your password, go to your
          {' '}
          <Link to={`${admin}/logout`}>account</Link>
          {' '}
          and edit your password there.
        </p>
        <br />
        <Button
          el="link"
          type="secondary"
          to={admin}
        >
          Back to Dashboard
        </Button>
      </MinimalTemplate>
    );
  }

  if (hasSubmitted) {
    return (
      <MinimalTemplate className={baseClass}>
        <h1>Email sent</h1>
        <p>
          Check your email for a link that will allow you to securely reset your password.
        </p>
        <br />
        <Button
          el="link"
          type="secondary"
          to={`${admin}/login`}
        >
          Go to login
        </Button>
      </MinimalTemplate>
    );
  }

  return (
    <MinimalTemplate className={baseClass}>
      <StatusList />
      <Form
        novalidate
        handleAjaxResponse={handleAjaxResponse}
        method="POST"
        action={`${serverURL}${api}/forgot-password`}
      >
        <h1>Forgot Password</h1>
        <Email
          label="Email Address"
          name="email"
          required
        />
        <FormSubmit>Submit</FormSubmit>
      </Form>
    </MinimalTemplate>
  );
};

export default ForgotPassword;
