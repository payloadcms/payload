import React from 'react';
import { Link } from 'react-router-dom';
import { SetStepNav } from 'payload/components';

import './index.css';

const Dashboard = () => {
  return (
    <article className="dashboard">
      <SetStepNav nav={ [] } />
      <h1>Dashboard</h1>
      <Link to="/login">Login</Link>
      <br />
      <Link to="/create-user">Create User</Link>
      <br />
      <Link to="/collections/pages">Pages Archive</Link>
      <br />
      <Link to="/collections/pages/test123">Edit Page</Link>
    </article>
  );
};

export default Dashboard;
