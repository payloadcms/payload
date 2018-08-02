import React, { Component } from 'react';
import ViewEdit from 'payload/client/components/views/collections/Edit';

class PagesEdit extends Component {
  render() {
    return (
      <ViewEdit slug="pages" id={this.props.match.params.id}>
        <h1>Edit Page {this.props.match.params.id}</h1>
      </ViewEdit>
    );
  }
}

export default PagesEdit;
