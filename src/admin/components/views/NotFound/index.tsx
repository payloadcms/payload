import React, { useEffect } from 'react';
import { useConfig } from '../../utilities/Config';
import Eyebrow from '../../elements/Eyebrow';
import { useStepNav } from '../../elements/StepNav';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';

import './index.scss';

const baseClass = 'not-found';

const NotFound: React.FC = () => {
  const { setStepNav } = useStepNav();
  const { routes: { admin } } = useConfig();

  useEffect(() => {
    setStepNav([{
      label: 'Not Found',
    }]);
  }, [setStepNav]);

  return (
    <div className={baseClass}>
      <Meta
        title="Not Found"
        description="Page not found"
        keywords="404, Not found, Payload, CMS"
      />
      <Eyebrow />
      <div className={`${baseClass}__wrap`}>
        <h1>Nothing found</h1>
        <p>Sorry&mdash;there is nothing to correspond with your request.</p>
        <Button
          el="link"
          to={`${admin}`}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
