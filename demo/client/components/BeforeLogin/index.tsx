import React from 'react';

const BeforeLogin: React.FC = () => {
  return (
    <div>
      <h3>Welcome</h3>
      <p>
        This demo is a set up to configure Payload for the develop and testing of features. To see a product demo of a Payload project
        please visit:
        {' '}
        <a
          href="https://demo.payloadcms.com"
          target="_blank"
          rel="noreferrer"
        >
          demo.payloadcms.com
        </a>
        .
      </p>
    </div>
  );
};

export default BeforeLogin;
