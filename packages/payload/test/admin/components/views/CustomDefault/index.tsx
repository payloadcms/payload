import React, { useEffect } from 'react';
import { Redirect } from 'react-router-dom';

// As this is the demo project, we import our dependencies from the `src` directory.
import DefaultTemplate from '../../../../../src/admin/components/templates/Default';
import Button from '../../../../../src/admin/components/elements/Button';
import Eyebrow from '../../../../../src/admin/components/elements/Eyebrow';
import { AdminView } from '../../../../../src/config/types';
import { useStepNav } from '../../../../../src/admin/components/elements/StepNav';
import { useConfig } from '../../../../../src/admin/components/utilities/Config';
import Meta from '../../../../../src/admin/components/utilities/Meta';

// In your projects, you can import as follows:
// import { DefaultTemplate } from 'payload/components/templates';
// import { Button, Eyebrow } from 'payload/components/elements';
// import { AdminView } from 'payload/config';
// import { useStepNav } from 'payload/components/hooks';
// import { useConfig, Meta } from 'payload/components/utilities';

const CustomDefaultRoute: AdminView = ({ user, canAccessAdmin }) => {
  const { routes: { admin: adminRoute } } = useConfig();
  const { setStepNav } = useStepNav();

  // This effect will only run one time and will allow us
  // to set the step nav to display our custom route name

  useEffect(() => {
    setStepNav([
      {
        label: 'Custom Route with Default Template',
      },
    ]);
  }, [setStepNav]);

  // If an unauthorized user tries to navigate straight to this page,
  // Boot 'em out
  if (!user || (user && !canAccessAdmin)) {
    return (
      <Redirect to={`${adminRoute}/unauthorized`} />
    );
  }

  return (
    <DefaultTemplate>
      <Meta
        title="Custom Route with Default Template"
        description="Building custom routes into Payload is easy."
        keywords="Custom React Components, Payload, CMS"
      />
      <Eyebrow />
      <h1>Custom Route</h1>
      <p>Here is a custom route that was added in the Payload config. It uses the Default Template, so the sidebar is rendered.</p>
      <Button
        el="link"
        to={`${adminRoute}`}
        buttonStyle="secondary"
      >
        Go to Dashboard
      </Button>
    </DefaultTemplate>
  );
};

export default CustomDefaultRoute;
