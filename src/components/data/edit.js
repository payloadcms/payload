import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import api from 'payload/api';

const withEditData = PassedComponent => {

  class EditData extends Component {
    constructor(props) {
      super(props);

      this.state = {
        data: null
      }
    }

    componentDidMount() {
      const slug = this.props.match.params.slug;

      if (slug) {
        api.requests.get(`${this.props.config.serverUrl}/${this.props.collection.slug}/${slug}`).then(
          res => this.setState({ data: res }),
          err => {
            console.warn(err);
            this.props.history.push('/not-found');
          }
        )
      }
    }

    render() {
      return <PassedComponent {...this.props} data={this.state.data } />;
    }
  }

  return withRouter(EditData);
}

export default withEditData;
