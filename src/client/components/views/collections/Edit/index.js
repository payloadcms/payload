import React, { Component } from 'react';
import { connect } from 'react-redux';
import SetStepNav from 'payload/client/components/utilities/SetStepNav';

const mapStateToProps = state => ({
  collections: state.collections.all
});

class Edit extends Component {
  constructor(props) {
    super(props);

    this.collection = this.props.collections[this.props.slug];
  }

  render() {
    return (
      <article className="collection-edit">
        <SetStepNav nav={ [
          {
            url: `/collections/${this.props.slug}`,
            label: this.collection.attrs.label
          },
          {
            url: `/collections/${this.props.slug}/${this.props.id}`,
            label: this.props.id
          }
        ] } />
        {this.props.children}
      </article>
    );
  }
}

export default connect(mapStateToProps)(Edit);
