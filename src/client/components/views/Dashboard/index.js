import React from 'react';
import { Link } from 'react-router-dom';
import DefaultTemplate from '../../layout/DefaultTemplate';
import getSanitizedConfig from '../../../config/getSanitizedConfig';

import './index.scss';

const {
  routes: {
    admin,
  },
} = getSanitizedConfig();

const baseClass = 'dashboard';

const Dashboard = () => {
  return (
    <DefaultTemplate
      className={baseClass}
      stepNav={[]}
    >
      <h1>Dashboard</h1>
      <Link to={`${admin}/login`}>Login</Link>
      <br />
      <Link to={`${admin}/create-user`}>Create User</Link>
      <br />
      <Link to={`${admin}/collections/pages`}>Pages List</Link>
      <br />
      <Link to={`${admin}/collections/pages/test123`}>Edit Page</Link>
    </DefaultTemplate>
  );
};

export default Dashboard;
