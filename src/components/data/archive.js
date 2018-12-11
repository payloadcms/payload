import React, { Component } from 'react';
import api from 'payload/api';

const withArchiveData = PassedComponent => {

  class ArchiveData extends Component {

    constructor(props) {
      super(props);

      this.state = {
        data: null
      }
    }

    componentDidMount() {
      api.requests.get(`${this.props.config.serverUrl}/${this.props.collection.slug}`).then(
        res => this.setState({ data: res }),
        err => console.warn(err)
      )
    }

    render() {
      return <PassedComponent {...this.props} data={this.state.data} />;
    }
  }

  return ArchiveData;
}

export default withArchiveData;
