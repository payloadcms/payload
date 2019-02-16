import React from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { NavLink, Link } from 'react-router-dom';
import { Arrow } from 'payload/components';

import './index.scss';

const mapState = state => ({
  collections: state.common.collections
});

const Sidebar = props => {

  const Icon = props.icon;

  return (
    <aside className="sidebar">
      <Link to="/">
        <Icon />
      </Link>
      <span className="uppercase-label">Collections</span>
      <nav>
        {props.collections && Object.keys(props.collections).map((key, i) => {
          const href = `/collections/${props.collections[key].slug}`;
          const classes = props.location.pathname.indexOf(href) > -1
            ? 'active'
            : undefined;

          return (
            <Link className={classes} key={i} to={href}>
              <Arrow />
              {props.collections[key].plural}
            </Link>
          );
        })}
      </nav>
      <span className="uppercase-label">Globals</span>
      <nav>
        <NavLink activeClassName="active" to="/components">Components</NavLink>
        <NavLink activeClassName="active" to="/settings">Settings</NavLink>
      </nav>
    </aside>
  );
}

export default withRouter(connect(mapState)(Sidebar));
