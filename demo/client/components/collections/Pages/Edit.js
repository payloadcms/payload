import React, { Component } from 'react';

class PagesEdit extends Component {
  render() {

    return (
      <div>
        <h1>Edit page {this.props.match.params.id}</h1>
      </div>
    );
  }
}

export default PagesEdit;
