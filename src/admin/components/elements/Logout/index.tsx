import React from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../../utilities/Config';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import LogOut from '../../icons/LogOut';

const baseClass = 'nav';

export const logoutDefaultRoute = '/logout';
export const logoutDefaultInactivityRoute = '/logout-inactivity';

const DefaultLogout = ()=> {
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
    return <Link 
        to={`${admin}${logoutRoute}`}
        className={`${baseClass}__log-out`}
        >
            <LogOut />
    </Link>;
}

const Logout: React.FC = () => {
    const {
      admin: {
        components: {
          logout: {
            Component: CustomLogout,
          } = {
            Component: undefined
          }
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