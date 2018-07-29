import React, { Component } from 'react';
import { withRouter, Switch } from 'react-router-dom';
import Auth from 'payload/client/components/routes/Auth';

class Routes extends Component {
  render() {
    return (
      <Switch location={this.props.location}>
        <Auth />
      </Switch>
    );
  }
}

export default withRouter(Routes);
