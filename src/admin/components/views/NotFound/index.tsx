import React, { useEffect } from 'react';
import { useConfig } from '@payloadcms/config-provider';
import Eyebrow from '../../elements/Eyebrow';
import { useStepNav } from '../../elements/StepNav';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';

const NotFound: React.FC = () => {
  const { setStepNav } = useStepNav();
  const { routes: { admin } } = useConfig();

  useEffect(() => {
    setStepNav([{
      label: 'Not Found',
    }]);
  }, [setStepNav]);

  return (
    <div className="not-found">
      <Meta
        title="Not Found"
        description="Page not found"
        keywords="404, Not found, Payload, CMS"
      />
      <Eyebrow />
      <h1>Nothing found</h1>
      <p>Sorry&mdash;there is nothing to correspond with your request.</p>
      <br />
      <Button
        el="link"
        to={`${admin}`}
      >
        Back to Dashboard
      </Button>
    </div>
  );
};

export default NotFound;
