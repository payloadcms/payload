import React, { Component } from 'react';
import { connect } from 'react-redux';
import SetStepNav from 'payload/client/components/utilities/SetStepNav';
import HeadingButton from 'payload/client/components/layout/HeadingButton';

const mapStateToProps = state => ({
  collections: state.collections.all
});

class Archive extends Component {
  constructor(props) {
    super(props);

    this.collection = this.props.collections[this.props.slug];
  }

  render() {
    return (
      <article className="collection-archive">
        <SetStepNav nav={ [
          {
            label: this.collection.attrs.label
          }
        ] } />
        {this.props.children}
        <HeadingButton
          heading={this.collection.attrs.label}
          buttonLabel="Add New"
          buttonUrl={`/collections/${this.props.slug}/add-new`}
          buttonType="link" />
      </article>
    );
  }
}

export default connect(mapStateToProps)(Archive);
