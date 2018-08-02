import React, { Component } from 'react';
import { connect } from 'react-redux';
import SetStepNav from 'payload/client/components/utilities/SetStepNav';

const mapStateToProps = state => ({
  collections: state.collections.all
});

class CollectionAdd extends Component {
  constructor(props) {
    super(props);

    this.collection = this.props.collections[this.props.slug];
  }

  render() {
    return (
      <article className="collection-add">
        <SetStepNav nav={ [
          {
            url: `/collections/${this.props.slug}`,
            label: this.collection.attrs.label
          },
          {
            label: `Add New`
          }
        ] } />
        {this.props.children}
      </article>
    );
  }
}

export default connect(mapStateToProps)(CollectionAdd);
