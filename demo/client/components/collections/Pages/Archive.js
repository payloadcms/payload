import React, { Component } from 'react';
import { connect } from 'react-redux';

import ArchiveView from 'payload/client/components/views/collections/Archive';
import HeadingButton from 'payload/client/components/layout/HeadingButton';

const mapStateToProps = state => ({
  collections: state.collections.all
});

class Archive extends Component {
  constructor(props) {
    super(props);
    this.slug = 'pages';
    this.collection = this.props.collections[this.slug];
  }

  render() {
    return (
      <ArchiveView slug={this.slug} collection={this.collection}>
        <HeadingButton
          heading={this.collection.attrs.label}
          buttonLabel="Add New"
          buttonUrl={`/collections/${this.slug}/add-new`}
          buttonType="link" />
      </ArchiveView>
    );
  }
}

export default connect(mapStateToProps)(Archive);
