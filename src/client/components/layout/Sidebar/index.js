import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { NavLink, Link } from 'react-router-dom';
import { Arrow, Label } from 'payload/components';

import Icon from 'local/client/components/graphics/Icon';

import './index.css';

const mapStateToProps = state => ({
  collections: state.collections.all
});

class Sidebar extends Component {
  render() {
    return (
      <aside className="sidebar">
        <Link to="/">
          <Icon />
        </Link>
        <Label>Collections</Label>
        <nav>
          {this.props.collections.map((item, i) => {
            const href = `/collections/${item.slug}`;
            const classes = this.props.location.pathname.indexOf(href) > -1
              ? 'active'
              : undefined;

            return (
              <Link className={classes} key={i} to={href}>
                <Arrow />
                {this.props.collections[i].plural}
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
}

export default withRouter(connect(mapStateToProps)(Sidebar));
