import React, { Component } from 'react';
import { connect } from 'react-redux';

import { ListView, HeadingButton, Filter } from 'payload/components';

const mapStateToProps = state => ({
  collections: state.collections.all
});

class List extends Component {
  constructor(props) {
    super(props);
    this.slug = 'orders';
    this.collection = this.props.collections.find(collection => {
      return collection.slug === this.slug;
    });
  }

  render() {
    return (
      <ListView slug={this.slug} collection={this.collection}>
        <HeadingButton
          heading="Orders"
          buttonLabel="Add New"
          buttonUrl={`/collections/${this.slug}/create`}
          buttonType="link" />
        <Filter />
      </ListView>
    );
  }
}

export default connect(mapStateToProps)(List);
