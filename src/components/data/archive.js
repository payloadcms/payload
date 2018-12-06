import React, { Component } from 'react';
import api from 'payload/api';

const withArchiveData = (PassedComponent, collection, config) => {

  class ArchiveData extends Component {

    constructor(props) {
      super(props);

      this.state = {
        data: null
      }
    }

    componentDidMount() {
      api.requests.get(`${config.serverUrl}/${collection.slug}`).then(
        res =>
          this.setState({ data: res }),
        err =>
          console.warn(err)
      )
    }

    render() {
      return <PassedComponent {...this.props} data={this.state.data} />;
    }
  }

  return ArchiveData;
}

export default withArchiveData;
