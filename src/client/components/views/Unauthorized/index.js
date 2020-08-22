import React from 'react';
import config from 'payload/config';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';
import MinimalTemplate from '../../templates/Minimal';

const { routes: { admin } } = config;

const Unauthorized = () => (
  <MinimalTemplate className="unauthorized">
    <Meta
      title="Unauthorized"
      description="Unauthorized"
      keywords="Unauthorized, Payload, CMS"
    />
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
export default Unauthorized;
