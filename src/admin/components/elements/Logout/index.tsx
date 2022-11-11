import React from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../../utilities/Config';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import LogOut from '../../icons/LogOut';

const baseClass = 'nav';

const DefaultLogout = () => {
  const config = useConfig();
  const {
    routes: { admin },
    admin: {
      logoutRoute,
      components: { logout }
    }
  } = config;
  return (
    <Link to={`${admin}${logoutRoute}`} className={`${baseClass}__log-out`}>
      <LogOut />
    </Link>
  );
};

const Logout: React.FC = () => {
  const {
    admin: {
      components: {
        logout: { Button: CustomLogout } = {
          Button: undefined,
        },
      } = {},
    } = {},
  } = useConfig();

  return (
    <RenderCustomComponent
      CustomComponent={CustomLogout}
      DefaultComponent={DefaultLogout}
    />
  );
};

export default Logout;
