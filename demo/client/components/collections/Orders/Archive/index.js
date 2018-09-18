import React, { Component } from 'react';
import { connect } from 'react-redux';

import { ArchiveView, HeadingButton, Filter } from 'payload/components';

const mapStateToProps = state => ({
  collections: state.collections.all
});

class Archive extends Component {
  constructor(props) {
    super(props);
    this.slug = 'orders';
    this.collection = this.props.collections.find(collection => {
      return collection.slug === this.slug;
    });
  }

  render() {
    return (
      <ArchiveView slug={this.slug} collection={this.collection}>
        <HeadingButton
          heading="Orders"
          buttonLabel="Add New"
          buttonUrl={`/collections/${this.slug}/add-new`}
          buttonType="link" />
        <Filter />
      </ArchiveView>
    );
  }
}

export default connect(mapStateToProps)(Archive);
