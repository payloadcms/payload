import React from 'react';
import { Link } from 'react-router-dom';
import SetStepNav from 'payload/client/components/utilities/SetStepNav';

import './index.css';

export default () => {
  return (
    <article className="dashboard">
      <SetStepNav nav={ [] } />
      <h1>Dashboard</h1>
      <Link to="/login">Login</Link>
      <br />
      <Link to="/collections/pages">Pages Archive</Link>
      <br />
      <Link to="/collections/pages/test123">Edit Page</Link>
    </article>
  );
};
