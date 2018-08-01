import React, { Component } from 'react';
import CollectionEdit from 'payload/client/components/views/CollectionEdit';

class PagesEdit extends Component {
  render() {
    return (
      <CollectionEdit id={this.props.match.params.id}>
        <h1>Edit page {this.props.match.params.id}</h1>
      </CollectionEdit>
    );
  }
}

export default PagesEdit;
