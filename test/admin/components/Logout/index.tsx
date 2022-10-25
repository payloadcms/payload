import React from 'react';
import { useConfig } from '../../../../src/admin/components/utilities/Config';
import LogOut from '../../../../src/admin/components/icons/LogOut';
import { getSanitizedLogoutRoutes } from '../../../../src/admin/components/elements/Logout';


const Logout: React.FC = () => {
  const config = useConfig();
  const {
      routes: {
        admin,
      },
      admin: {
        components: {
          logout
        },
      },
    } = config;
    const { Route: logoutRoute } = logout;
  return (
    <a href={`${admin}${logoutRoute}#custom`}>
      <LogOut />
    </a>
  );
};

export default Logout;
