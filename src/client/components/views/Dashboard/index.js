import React, { useState, useEffect } from 'react';
import config from 'payload/config';
import { useUser } from '../../data/User';
import { useStepNav } from '../../elements/StepNav';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import DefaultDashboard from './Default';

const {
  collections,
  globals,
} = config;

const Dashboard = () => {
  const { permissions } = useUser();
  const { setStepNav } = useStepNav();
  const [filteredGlobals, setFilteredGlobals] = useState([]);

  useEffect(() => {
    setFilteredGlobals(
      globals.filter((global) => permissions?.[global.slug]?.read?.permission),
    );
  }, [permissions]);

  useEffect(() => {
    setStepNav([]);
  }, [setStepNav]);

  return (
    <RenderCustomComponent
      DefaultComponent={DefaultDashboard}
      path="views.List"
      componentProps={{
        globals: filteredGlobals,
        collections: collections.filter((collection) => permissions?.[collection.slug]?.read?.permission),
        permissions,
      }}
    />
  );
};

export default Dashboard;
