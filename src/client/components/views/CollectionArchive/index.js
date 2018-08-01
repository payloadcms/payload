import React, { Component } from 'react';
import SetStepNav from 'payload/client/components/utilities/SetStepNav';

class CollectionArchive extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <article className="collection-archive">
        <SetStepNav nav={ [
          {
            url: '/collections',
            label: this.props.collection
          }
        ] } />
        {this.props.children}
      </article>
    );
  }
}

export default CollectionArchive;
