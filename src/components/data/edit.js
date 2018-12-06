import React, { Component } from 'react';

const withEditData = (PassedComponent, collection, config) => {

  class EditData extends Component {
    constructor(props) {
      super(props);

      this.state = {
        data: null
      }
    }

    render() {
      return <PassedComponent {...this.props} data={this.state.data } />;
    }
  }

  return EditData;
}

export default withEditData;
