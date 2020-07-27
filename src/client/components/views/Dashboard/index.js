import React, { useEffect } from 'react';
import { useStepNav } from '../../elements/StepNav';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import DefaultDashboard from './Default';

const Dashboard = () => {
  const { setStepNav } = useStepNav();

  useEffect(() => {
    setStepNav([]);
  }, [setStepNav]);

  return (
    <RenderCustomComponent
      DefaultComponent={DefaultDashboard}
      path="views.List"
    />
  );
};

export default Dashboard;
