import React from 'react';
import { useConfig } from '../../utilities/Config';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';
import MinimalTemplate from '../../templates/Minimal';

const Unauthorized: React.FC = () => {
  const { routes: { admin } } = useConfig();

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
        to={`${admin}/logout`}
      >
        Log out
      </Button>
    </MinimalTemplate>
  );
};

export default Unauthorized;
