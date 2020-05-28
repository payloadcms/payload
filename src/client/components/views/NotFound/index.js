import React, { useEffect } from 'react';
import Eyebrow from '../../elements/Eyebrow';
import { useStepNav } from '../../elements/StepNav';
import Button from '../../elements/Button';

const { routes: { admin } } = PAYLOAD_CONFIG;

const NotFound = () => {
  const { setStepNav } = useStepNav();

  useEffect(() => {
    setStepNav([{
      label: 'Not Found',
    }]);
  }, [setStepNav]);

  return (
    <div className="not-found">
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
