import React, { Component } from 'react';
import { connect } from 'react-redux';
import api from 'payload/api';

const mapState = state => ({
  locale: state.common.locale
})

const withArchiveData = PassedComponent => {

  class ArchiveData extends Component {

    constructor(props) {
      super(props);

      this.state = {
        data: []
      }
    }

    fetchData = () => {
      const params = {
        lang: this.props.locale
      };

      api.requests.get(`${this.props.config.serverUrl}/${this.props.collection.slug}`, params).then(
        res => this.setState({ data: res }),
        err => console.warn(err)
      )
    }

    componentDidMount() {
      this.fetchData();
    }

    componentDidUpdate(prevProps) {
      if (prevProps.locale !== this.props.locale) {
        this.fetchData();
      }
    }

    render() {
      return <PassedComponent {...this.props} data={this.state.data} />;
    }
  }

  return connect(mapState)(ArchiveData);
}

export default withArchiveData;
