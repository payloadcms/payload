import React from 'react';
import { useConfig } from '../../utilities/Config';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';
import MinimalTemplate from '../../templates/Minimal';
import { logoutDefaultRoute } from '../../elements/Logout';

const Unauthorized: React.FC = () => {
  const { 
    routes: { admin },
    admin: {
      components: {
        logout
      },
    },
  } = useConfig();
  const { route: logoutRoute = logoutDefaultRoute } = logout;

  return (
    <MinimalTemplate className="unauthorized">
      <Meta
        title="Unauthorized"
        description="Unauthorized"
        keywords="Unauthorized, Payload, CMS"
      />
      <h2>Unauthorized</h2>
      <p>You are not allowed to access this page.</p>
      <br />
      <Button
        el="link"
        to={`${admin}${logoutRoute}`}
      >
        Log out
      </Button>
    </MinimalTemplate>
  );
};

export default Unauthorized;
