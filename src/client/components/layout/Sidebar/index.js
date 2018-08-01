import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { NavLink, Link } from 'react-router-dom';
import Icon from 'demo/client/components/graphics/Icon';
import Arrow from 'payload/client/components/graphics/Arrow';
import Label from 'payload/client/components/type/Label';

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
          {this.props.collections.map((collection, i) => {
            const href = `/collections/${collection.attrs.slug}`;
            const classes = this.props.location.pathname.indexOf(href) > -1
              ? 'active'
              : undefined;

            return (
              <Link className={classes} key={i} to={href}>
                <Arrow />
                {collection.attrs.plural}
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
