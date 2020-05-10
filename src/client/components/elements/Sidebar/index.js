import React from 'react';
import { useLocation, NavLink, Link } from 'react-router-dom';
import { useUser } from '../../data/User';
import Chevron from '../../icons/Chevron';

import './index.scss';

const {
  User,
  collections,
  globals,
  routes: {
    admin,
  },
} = PAYLOAD_CONFIG;

const Sidebar = () => {
  const location = useLocation();
  const { permissions } = useUser();

  return (
    <aside className="sidebar">
      <Link
        to={admin}
        className="brand"
      >
        Home
      </Link>
      <span className="label">Collections</span>
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
        {permissions?.[User.slug].read.permission && (
          <NavLink
            activeClassName="active"
            to={`${admin}/${User.slug}`}
          >
            <Chevron />
            {User.labels.singular}
          </NavLink>
        )}
      </nav>
      <span className="label">Globals</span>
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
      <Link
        to={`${admin}/logout`}
        className="log-out"
      >
        Log out
      </Link>
    </aside>
  );
};

export default Sidebar;
