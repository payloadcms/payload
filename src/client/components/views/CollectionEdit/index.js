import React, { Component } from 'react';
import SetStepNav from 'payload/client/components/utilities/SetStepNav';

class CollectionEdit extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <article className="collection-edit">
        <SetStepNav nav={ [
          {
            url: '/collections/pages',
            label: 'Pages'
          },
          {
            url: `/collections/pages/${this.props.id}`,
            label: this.props.id
          }
        ] } />
        {this.props.children}
      </article>
    );
  }
}

export default CollectionEdit;
