import React from 'react';

import LogOut from '../../../../src/admin/components/icons/LogOut/index.js';
import { useConfig } from '../../../../src/admin/components/utilities/Config/index.js';


const Logout: React.FC = () => {
  const config = useConfig();
  const {
    admin: {
      logoutRoute
    },
    routes: {
      admin,
    },
  } = config;
  return (
    <a href={`${admin}${logoutRoute}#custom`}>
      <LogOut />
    </a>
  );
};

export default Logout;
