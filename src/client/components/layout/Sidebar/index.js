import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
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
            return (
              <Link key={i} to={`/collections/${collection.slug}`}>{collection.plural}</Link>
            );
          })}
        </nav>
      </aside>
    );
  }
};

export default connect(mapStateToProps)(Sidebar);
