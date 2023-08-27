import React from 'react';
import { useConfig } from '../../../../src/admin/components/utilities/Config.js';
import LogOut from '../../../../src/admin/components/icons/LogOut.js';


const Logout: React.FC = () => {
  const config = useConfig();
  const {
    routes: {
      admin,
    },
    admin: {
      logoutRoute
    },
  } = config;
  return (
    <a href={`${admin}${logoutRoute}#custom`}>
      <LogOut />
    </a>
  );
};

export default Logout;
