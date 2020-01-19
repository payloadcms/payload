import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStepNav } from '../../modules/StepNav';

import './index.scss';

const Dashboard = () => {
  const { setStepNav } = useStepNav();

  useEffect(() => setStepNav([]), []);

  return (
    <article className="dashboard">
      <h1>Dashboard</h1>
      <Link to="/login">Login</Link>
      <br />
      <Link to="/create-user">Create User</Link>
      <br />
      <Link to="/collections/pages">Pages List</Link>
      <br />
      <Link to="/collections/pages/test123">Edit Page</Link>
    </article>
  );
};

export default Dashboard;
