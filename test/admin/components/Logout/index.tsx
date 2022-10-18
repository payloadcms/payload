import React from 'react';
import { useConfig } from '../../../../src/admin/components/utilities/Config';
import LogOut from '../../../../src/admin/components/icons/LogOut';
import { logoutDefaultRoute } from '../../../../src/admin/components/elements/Logout';


const Logout: React.FC = () => {
  const {
      routes: {
        admin,
      },
      admin: {
        components: {
          logout
        },
      },
    } = useConfig();
    const { route: logoutRoute = logoutDefaultRoute } = logout;
  return (
    <a href={`${admin}${logoutRoute}#custom`}>
      <LogOut />
    </a>
  );
};

export default Logout;
