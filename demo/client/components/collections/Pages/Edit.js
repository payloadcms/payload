import React, { Component } from 'react';
import CollectionEdit from 'payload/client/components/views/CollectionEdit';

class PagesEdit extends Component {
  render() {
    return (
      <CollectionEdit collection="Pages" id={this.props.match.params.id}>
        <h1>Edit Page {this.props.match.params.id}</h1>
      </CollectionEdit>
    );
  }
}

export default PagesEdit;
