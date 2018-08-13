import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Switch, withRouter } from 'react-router-dom';

import { CollectionRoutes } from 'payload/components';
import { DefaultTemplate } from 'payload/components';
import { Dashboard } from 'payload/components';
import { Login } from 'payload/components';

const mapStateToProps = state => ({
  collections: state.collections.all
});

class Routes extends Component {
  render() {
    return (
      <Switch location={this.props.location}>
        <Route path="/login" component={Login} />
        <Route path="/forgot" component={ () => { return <h1>Forgot Password</h1>; } } />
        <Route path="/" render={() => {
          return (
            <DefaultTemplate>
              <Route path="/" exact component={Dashboard} />
              <CollectionRoutes collections={this.props.collections} />
            </DefaultTemplate>
          );
        }} />
      </Switch>
    );
  }
}

export default withRouter(connect(mapStateToProps)(Routes));
