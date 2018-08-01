import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavLink, Link } from 'react-router-dom';
import Icon from 'demo/client/components/graphics/Icon';
import Label from '../../type/Label';

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

            return (
              <NavLink activeClassName="active" key={i} to={href}>{collection.attrs.plural}</NavLink>
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

export default connect(mapStateToProps)(Sidebar);
