import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useUser } from '../../data/User';
import Chevron from '../../icons/Chevron';
import LogOut from '../../icons/LogOut';
import Icon from '../../graphics/Icon';
import Account from '../../graphics/Account';
import Localizer from '../Localizer';

import './index.scss';

const baseClass = 'sidebar';

const {
  collections,
  globals,
  routes: {
    admin,
  },
} = PAYLOAD_CONFIG;

const Sidebar = () => {
  const { permissions } = useUser();

  return (
    <aside className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <Link
          to={admin}
          className={`${baseClass}__brand`}
        >
          <Icon />
        </Link>
        <span className={`${baseClass}__label`}>Collections</span>
        <nav>
          {collections && collections.map((collection, i) => {
            const href = `${admin}/collections/${collection.slug}`;

            if (permissions?.[collection.slug]?.read.permission) {
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
        <span className={`${baseClass}__label`}>Globals</span>
        <nav>
          {globals && globals.map((global, i) => {
            const href = `${admin}/globals/${global.slug}`;

            if (permissions?.[global.slug].read.permission) {
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
    </aside>
  );
};

export default Sidebar;
