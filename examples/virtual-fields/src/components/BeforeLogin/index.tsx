import React from 'react';

const BeforeLogin: React.FC = () => {
  if (process.env.PAYLOAD_PUBLIC_SEED === 'true') {
    return (
      <div>
        <h3>Virtual Fields Demo</h3>
        <p>
          Log in with the email
          {' '}
          <strong>dev@payloadcms.com</strong>
          {' '}
          and the password
          {' '}
          <strong>test</strong>
          .
        </p>
      </div>
    );
  }
  return null;
};

export default BeforeLogin;
