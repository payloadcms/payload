import React from 'react';
import config from 'payload/config';
import Button from '../../elements/Button';
import MinimalTemplate from '../../templates/Minimal';

const { routes: { admin } } = config;

const Unauthorized = () => {
  return (
    <MinimalTemplate className="unauthorized">
      <h1>Not authorized</h1>
      <p>You are not allowed to access this page.</p>
      <br />
      <Button
        el="link"
        to={`${admin}/logout`}
      >
        Log out
      </Button>
    </MinimalTemplate>
  );
};

export default Unauthorized;
