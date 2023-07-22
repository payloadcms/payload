import React, { useEffect, useState } from 'react';
import { useConfig } from '../../utilities/Config';
import { useAuth } from '../../utilities/Auth';
import { useStepNav } from '../../elements/StepNav';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import DefaultDashboard from './Default';

const Dashboard: React.FC = () => {
  const { permissions, user } = useAuth();
  const { setStepNav } = useStepNav();
  const [filteredGlobals, setFilteredGlobals] = useState([]);

  const {
    collections,
    globals,
    admin: {
      components: {
        views: {
          Dashboard: CustomDashboard,
        } = {
          Dashboard: undefined,
        },
      } = {},
    } = {},
  } = useConfig();

  useEffect(() => {
    setFilteredGlobals(
      globals.filter((global) => permissions?.globals?.[global.slug]?.read?.permission),
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
        collections: collections.filter((collection) => permissions?.collections?.[collection.slug]?.read?.permission),
        permissions,
        user,
      }}
    />
  );
};

export default Dashboard;
