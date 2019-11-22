import React from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { NavLink, Link } from 'react-router-dom';
import Arrow from '../../graphics/Arrow';
import Icon from '../../graphics/Icon';

import './index.scss';

const mapState = state => ({
  config: state.common.config
});

const Sidebar = props => {

  const {
    collections,
    routes: {
      admin,
    }
  } = props.config;

  return (
    <aside className="sidebar">
      <Link to="/">
        <Icon />
      </Link>
      <span className="uppercase-label">Collections</span>
      <nav>
        {collections && Object.keys(collections).map((key, i) => {
          const href = `${admin}/collections/${collections[key].slug}`;
          const classes = props.location.pathname.indexOf(href) > -1
            ? 'active'
            : undefined;

          return (
            <Link className={classes} key={i} to={href}>
              <Arrow />
              {collections[key].labels.plural}
            </Link>
          );
        })}
      </nav>
      <span className="uppercase-label">Globals</span>
      <nav>
        <NavLink activeClassName="active" to="/media-library">
          <Arrow />
          Media Library
        </NavLink>
        <NavLink activeClassName="active" to="/components">
          <Arrow />
          Components
        </NavLink>
        <NavLink activeClassName="active" to="/settings">
          <Arrow />
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}

export default withRouter(connect(mapState)(Sidebar));
