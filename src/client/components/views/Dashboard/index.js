import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStepNav } from '../../elements/StepNav';
import config from '../../../securedConfig';

import './index.scss';

const {
  routes: {
    admin,
  },
} = config;

const baseClass = 'dashboard';

const Dashboard = () => {
  const { setStepNav } = useStepNav();

  useEffect(() => {
    setStepNav([]);
  }, [setStepNav]);

  return (
    <div className={baseClass}>
      <h1>Dashboard</h1>
      <Link to={`${admin}/login`}>Login</Link>
      <br />
      <Link to={`${admin}/collections/pages`}>Pages List</Link>
      <br />
      <Link to={`${admin}/collections/pages/test123`}>Edit Page</Link>
    </div>
  );
};

export default Dashboard;
