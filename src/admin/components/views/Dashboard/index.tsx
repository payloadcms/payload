import React, { useState, useEffect } from 'react';
import { useConfig } from '../../providers/Config';
import { useAuth } from '../../providers/Authentication';
import { useStepNav } from '../../elements/StepNav';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import DefaultDashboard from './Default';

const Dashboard = () => {
  const { permissions } = useAuth();
  const { setStepNav } = useStepNav();
  const [filteredGlobals, setFilteredGlobals] = useState([]);

  const {
    collections,
    globals,
    admin: {
      components: {
        Dashboard: CustomDashboard,
      } = {},
    } = {},
  } = useConfig();

  useEffect(() => {
    setFilteredGlobals(
      globals.filter((global) => permissions?.[global.slug]?.read?.permission),
    );
  }, [permissions, globals]);

  useEffect(() => {
    setStepNav([]);
  }, [setStepNav]);

  return (
    <RenderCustomComponent
      DefaultComponent={DefaultDashboard}
      CustomComponent={CustomDashboard}
      componentProps={{
        globals: filteredGlobals,
        collections: collections.filter((collection) => permissions?.[collection.slug]?.read?.permission),
        permissions,
      }}
    />
  );
};

export default Dashboard;
