import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../../providers/Config';
import MinimalTemplate from '../../templates/Minimal';
import StatusList, { useStatusList } from '../../elements/Status';
import Form from '../../forms/Form';
import Email from '../../forms/field-types/Email';
import FormSubmit from '../../forms/Submit';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';
import { useAuthentication } from '../../providers/Authentication';

import './index.scss';

const baseClass = 'forgot-password';

const ForgotPassword = () => {
  const { addStatus } = useStatusList();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { user } = useAuthentication();
  const {
    admin: { user: userSlug },
    serverURL,
    routes: {
      admin,
      api,
    },
  } = useConfig();

  const handleResponse = (res) => {
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
        <Meta
          title="Forgot Password"
          description="Forgot password"
          keywords="Forgot, Password, Payload, CMS"
        />

        <h1>You&apos;re already logged in</h1>
        <p>
          To change your password, go to your
          {' '}
          <Link to={`${admin}/account`}>account</Link>
          {' '}
          and edit your password there.
        </p>
        <br />
        <Button
          el="link"
          buttonStyle="secondary"
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
      </MinimalTemplate>
    );
  }

  return (
    <MinimalTemplate className={baseClass}>
      <StatusList />
      <Form
        novalidate
        handleResponse={handleResponse}
        method="POST"
        action={`${serverURL}${api}/${userSlug}/forgot-password`}
      >
        <h1>Forgot Password</h1>
        <p>Please enter your email below. You will receive an email message with instructions on how to reset your password.</p>
        <Email
          label="Email Address"
          name="email"
          autoComplete="email"
          required
        />
        <FormSubmit>Submit</FormSubmit>
      </Form>
      <Link to={`${admin}/login`}>Back to login</Link>
    </MinimalTemplate>
  );
};

export default ForgotPassword;
