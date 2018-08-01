import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Switch, withRouter } from 'react-router-dom';

import CollectionRoutes from 'payload/client/components/routes/Collections';
import DefaultTemplate from 'payload/client/components/layout/DefaultTemplate';
import Dashboard from 'payload/client/components/views/Dashboard';
import Login from 'payload/client/components/views/Login';

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
