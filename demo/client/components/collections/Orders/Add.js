import React, { Component } from 'react';
import { connect } from 'react-redux';

import AddView from 'payload/client/components/views/collections/Add';

const mapStateToProps = state => ({
  collections: state.collections.all
});

class Add extends Component {
  constructor(props) {
    super(props);
    this.slug = 'orders';
    this.collection = this.props.collections[this.slug];
  }

  render() {
    return (
      <AddView slug={this.slug} collection={this.collection}>
        <h1>Add New {this.collection.attrs.singular}</h1>
      </AddView>
    );
  }
}

export default connect(mapStateToProps)(Add);
