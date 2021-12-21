import { useConfig } from '@payloadcms/config-provider';
import React from 'react';
import { useHistory } from 'react-router-dom';

// As this is the demo project, we import our dependencies from the `src` directory.
import Card from '../../../../src/admin/components/elements/Card';

// In your projects, you can import as follows:
// import { Card } from 'payload/components/elements';

import './index.scss';

const baseClass = 'after-dashboard';

const AfterDashboard: React.FC = () => {
  const history = useHistory();
  const { routes: { admin: adminRoute } } = useConfig();

  return (
    <div className={baseClass}>
      <h3>Custom Routes &amp; Dashboard Components</h3>
      <p>This is a custom component that is rendered within the built-in dashboard component after its contents are rendered. Below, there are two cards that link to custom routes.</p>
      <ul className="dashboard__card-list">
        <li>
          <Card
            title="Default Template"
            onClick={() => history.push(`${adminRoute}/custom-default-route`)}
          />
        </li>
        <li>
          <Card
            title="Minimal Template"
            onClick={() => history.push(`${adminRoute}/custom-minimal-route`)}
          />
        </li>
      </ul>
    </div>
  );
};

export default AfterDashboard;
