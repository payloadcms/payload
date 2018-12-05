import React from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { NavLink, Link } from 'react-router-dom';
import { Arrow, Label } from 'payload/components';

import './index.scss';

const mapStateToProps = state => ({
  collections: state.collections.all
});

const Sidebar = props => {

  const Icon = props.icon;

  return (
    <aside className="sidebar">
      <Link to="/">
        <Icon />
      </Link>
      <Label>Collections</Label>
      <nav>
        {props.collections.map((item, i) => {
          const href = `/collections/${item.slug}`;
          const classes = props.location.pathname.indexOf(href) > -1
            ? 'active'
            : undefined;

          return (
            <Link className={classes} key={i} to={href}>
              <Arrow />
              {props.collections[i].plural}
            </Link>
          );
        })}
      </nav>
      <Label>Globals</Label>
      <nav>
        <NavLink activeClassName="active" to="/components">Components</NavLink>
        <NavLink activeClassName="active" to="/settings">Settings</NavLink>
      </nav>
    </aside>
  );
}

export default withRouter(connect(mapStateToProps)(Sidebar));
