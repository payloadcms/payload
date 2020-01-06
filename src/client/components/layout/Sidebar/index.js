import React from 'react';
import { withRouter, NavLink, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import config from 'payload-config';

import Arrow from '../../graphics/Arrow';
import Icon from '../../graphics/Icon';

import './index.scss';

const mapState = state => ({
  config: state.common.config,
});

const Sidebar = (props) => {
  const {
    collections,
    globals,
    routes: {
      admin,
    },
  } = config;

  return (
    <aside className="sidebar">
      <Link to="/">
        <Icon />
      </Link>
      <span className="uppercase-label">Collections</span>
      <nav>
        <NavLink
          activeClassName="active"
          to="/admin/media-library"
        >
          <Arrow />
          Media Library
        </NavLink>
        {collections && Object.keys(collections).map((key, i) => {
          const href = `${admin}/collections/${collections[key].slug}`;
          const classes = props.location.pathname.indexOf(href) > -1
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
      </nav>
      <span className="uppercase-label">Globals</span>
      <nav>
        {globals && globals.map((global, i) => {
          const href = `${admin}/globals/${global.slug}`;
          const classes = props.location.pathname.indexOf(href) > -1
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
    </aside>
  );
};

export default withRouter(connect(mapState)(Sidebar));
