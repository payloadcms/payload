import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Switch, withRouter } from 'react-router-dom';

import { CollectionRoutes } from 'payload/components';
import { DefaultTemplate } from 'payload/components';
import { Dashboard } from 'payload/components';
import { Login } from 'payload/components';

import pageViews from '../../Page/components';
import orderViews from '../../Order/components';

const modelViews = {
  orders: orderViews,
  pages: pageViews
};

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
              <CollectionRoutes collections={this.props.collections} modelViews={modelViews} />
            </DefaultTemplate>
          );
        }} />
      </Switch>
    );
  }
}

export default withRouter(connect(mapStateToProps)(Routes));
