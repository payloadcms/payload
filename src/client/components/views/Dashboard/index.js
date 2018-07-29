import React from 'react';
import { Link } from 'react-router-dom';

import './index.css';

export default () => {
  return (
    <article className="dashboard">
      <h1>Dashboard</h1>
      <Link to="/login">Login</Link>
      <br />
      <Link to="/collections/pages">Pages Archive</Link>
      <br />
      <Link to="/collections/pages/test123">Edit Page</Link>
    </article>
  );
};
