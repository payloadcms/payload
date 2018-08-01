import React, { Component } from 'react';
import SetStepNav from 'payload/client/components/utilities/SetStepNav';

class CollectionAdd extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <article className="collection-add">
        <SetStepNav nav={ [
          {
            url: `/collections/${this.props.collection}`,
            label: this.props.collection
          },
          {
            url: `/collections/${this.props.collection}/add-new`,
            label: `Add New`
          }
        ] } />
        {this.props.children}
      </article>
    );
  }
}

export default CollectionAdd;
