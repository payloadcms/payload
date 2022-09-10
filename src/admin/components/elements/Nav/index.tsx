import React, { useState, useEffect } from 'react';
import { NavLink, Link, useHistory } from 'react-router-dom';
import { useConfig } from '../../utilities/Config';
import { useAuth } from '../../utilities/Auth';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import Chevron from '../../icons/Chevron';
import LogOut from '../../icons/LogOut';
import Menu from '../../icons/Menu';
import CloseMenu from '../../icons/CloseMenu';
import Icon from '../../graphics/Icon';
import Account from '../../graphics/Account';
import Localizer from '../Localizer';
import NavGroup from '../NavGroup';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../../globals/config/types';

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
    admin: {
      components: {
        beforeNavLinks,
        afterNavLinks,
      },
    },
  } = useConfig();

  const classes = [
    baseClass,
    menuActive && `${baseClass}--menu-active`,
  ].filter(Boolean)
    .join(' ');

  const groupNavItems = (items) => {
    return items.reduce((acc, currentValue) => {
      if (currentValue.admin.group) {
        if (acc[currentValue.admin.group]) {
          acc[currentValue.admin.group].push(currentValue);
        } else {
          acc[currentValue.admin.group] = [currentValue];
        }
      } else {
        acc[''].push(currentValue);
      }
      return acc;
    }, { '': [] });
  };

  const groupedCollections: Record<string, SanitizedCollectionConfig[]> = groupNavItems(collections);
  const groupedGlobals: Record<string, SanitizedGlobalConfig[]> = groupNavItems(globals);

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
          {Array.isArray(beforeNavLinks) && beforeNavLinks.map((Component, i) => <Component key={i} />)}
          <span className={`${baseClass}__label`}>Collections</span>
          <nav className={`${baseClass}__collections`}>
            {Object.entries(groupedCollections)
              .map(([group, groupCollections]) => (
                <NavGroup
                  key={group}
                  label={group}
                  type="collections"
                >
                  {groupCollections.map((collection, i) => {
                    const href = `${admin}/collections/${collection.slug}`;

                    if (permissions?.collections?.[collection.slug]?.read.permission) {
                      return (
                        <NavLink
                          id={`nav-${collection.slug}`}
                          className={`${baseClass}__link`}
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
                </NavGroup>
              ))}
          </nav>
          {(globals && globals.length > 0) && (
            <React.Fragment>
              <span className={`${baseClass}__label`}>Globals</span>
              <nav className={`${baseClass}__globals`}>
                {Object.entries(groupedGlobals)
                  .map(([group, globalsGroup]) => (
                    <NavGroup
                      key={group}
                      label={group}
                      type="globals"
                    >
                      {globalsGroup.map((global, i) => {
                        const href = `${admin}/globals/${global.slug}`;

                        if (permissions?.globals?.[global.slug]?.read.permission) {
                          return (
                            <NavLink
                              id={`nav-global-${global.slug}`}
                              className={`${baseClass}__link`}
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
                    </NavGroup>
                  ))}
              </nav>
            </React.Fragment>
          )}
          {Array.isArray(afterNavLinks) && afterNavLinks.map((Component, i) => <Component key={i} />)}
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

const Nav: React.FC = () => {
  const {
    admin: {
      components: {
        Nav: CustomNav,
      } = {
        Nav: undefined,
      },
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
