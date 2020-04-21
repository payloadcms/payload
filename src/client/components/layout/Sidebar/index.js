import React from 'react';
import { useLocation, NavLink, Link } from 'react-router-dom';
import config from '../../../securedConfig';

import Arrow from '../../graphics/Arrow';
import Icon from '../../graphics/Icon';

import './index.scss';

const {
  collections,
  globals,
  routes: {
    admin,
  },
} = config;

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <Link
        to={admin}
        className="brand"
      >
        <Icon />
      </Link>
      <span className="uppercase-label">Collections</span>
      <nav>
        <NavLink
          activeClassName="active"
          to={`${admin}/media-library`}
        >
          <Arrow />
          Media Library
        </NavLink>
        {collections && Object.keys(collections).map((key, i) => {
          const href = `${admin}/collections/${collections[key].slug}`;
          const classes = location.pathname.indexOf(href) > -1
            ? 'active'
            : undefined;

          return (
            <Link
              className={classes}
              key={i}
              to={href}
            >
              <Arrow />
              {collections[key].labels.plural}
            </Link>
          );
        })}
        <NavLink
          activeClassName="active"
          to={`${admin}/users`}
        >
          <Arrow />
          Users
        </NavLink>
      </nav>
      <span className="uppercase-label">Globals</span>
      <nav>
        {globals && globals.map((global, i) => {
          const href = `${admin}/globals/${global.slug}`;
          const classes = location.pathname.indexOf(href) > -1
            ? 'active'
            : undefined;

          return (
            <Link
              className={classes}
              key={i}
              to={href}
            >
              <Arrow />
              {global.label}
            </Link>
          );
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
