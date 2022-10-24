import React from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../../utilities/Config';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import LogOut from '../../icons/LogOut';
import { SanitizedConfig } from 'payload/config';

const baseClass = 'nav';

export const logoutDefaultRoute = '/logout';
export const logoutDefaultInactivityRoute = '/logout-inactivity';

export interface SanitizedLogoutRoutes {
  logoutRoute: string;
  logoutInactivityRoute: string;
}

export function getSanitizedLogoutRoutes(config: SanitizedConfig): SanitizedLogoutRoutes {
  const {
    inactivityRoute: logoutInactivityRoute = logoutDefaultInactivityRoute,
    route: logoutRoute = logoutDefaultRoute,
  } = config.admin?.components?.logout || {};
  return { logoutRoute, logoutInactivityRoute };
}

const DefaultLogout = () => {
  const config = useConfig();
  const {
    routes: { admin },
  } = config;
  const { logoutRoute } = getSanitizedLogoutRoutes(config);
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
        logout: { Component: CustomLogout } = {
          Component: undefined,
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
