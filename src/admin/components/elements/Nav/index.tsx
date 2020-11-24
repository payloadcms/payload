import React, { useState, useEffect } from 'react';
import { NavLink, Link, useHistory } from 'react-router-dom';
import { useConfig, useAuth } from '@payloadcms/config-provider';

import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import Chevron from '../../icons/Chevron';
import LogOut from '../../icons/LogOut';
import Menu from '../../icons/Menu';
import CloseMenu from '../../icons/CloseMenu';
import Icon from '../../graphics/Icon';
import Account from '../../graphics/Account';
import Localizer from '../Localizer';

import './index.scss';

const baseClass = 'nav';

const DefaultNav = () => {
  const { permissions } = useAuth();
  const [menuActive, setMenuActive] = useState(false);
  const history = useHistory();
  const {
    collections,
    globals,
    routes: {
      admin,
    },
  } = useConfig();

  const classes = [
    baseClass,
    menuActive && `${baseClass}--menu-active`,
  ].filter(Boolean).join(' ');

  useEffect(() => history.listen(() => {
    setMenuActive(false);
  }), [history]);

  return (
    <aside className={classes}>
      <div className={`${baseClass}__scroll`}>
        <header>
          <Link
            to={admin}
            className={`${baseClass}__brand`}
          >
            <Icon />
          </Link>
          <button
            type="button"
            className={`${baseClass}__mobile-menu-btn`}
            onClick={() => setMenuActive(!menuActive)}
          >
            {menuActive && (
              <CloseMenu />
            )}
            {!menuActive && (
              <Menu />
            )}
          </button>
        </header>
        <div className={`${baseClass}__wrap`}>
          <span className={`${baseClass}__label`}>Collections</span>
          <nav>
            {collections && collections.map((collection, i) => {
              const href = `${admin}/collections/${collection.slug}`;

              if (permissions?.collections?.[collection.slug]?.read.permission) {
                return (
                  <NavLink
                    activeClassName="active"
                    key={i}
                    to={href}
                  >
                    <Chevron />
                    {collection.labels.plural}
                  </NavLink>
                );
              }

              return null;
            })}
          </nav>
          {(globals && globals.length > 0) && (
            <React.Fragment>
              <span className={`${baseClass}__label`}>Globals</span>
              <nav>
                {globals.map((global, i) => {
                  const href = `${admin}/globals/${global.slug}`;

                  if (permissions?.globals?.[global.slug].read.permission) {
                    return (
                      <NavLink
                        activeClassName="active"
                        key={i}
                        to={href}
                      >
                        <Chevron />
                        {global.label}
                      </NavLink>
                    );
                  }

                  return null;
                })}
              </nav>
            </React.Fragment>
          )}
          <div className={`${baseClass}__controls`}>
            <Localizer />
            <Link
              to={`${admin}/account`}
              className={`${baseClass}__account`}
            >
              <Account />
            </Link>
            <Link
              to={`${admin}/logout`}
              className={`${baseClass}__log-out`}
            >
              <LogOut />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Nav = () => {
  const {
    admin: {
      components: {
        Nav: CustomNav,
      } = {},
    } = {},
  } = useConfig();

  return (
    <RenderCustomComponent
      CustomComponent={CustomNav}
      DefaultComponent={DefaultNav}
    />
  );
};

export default Nav;
