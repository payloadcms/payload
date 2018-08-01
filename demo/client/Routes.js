import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Switch, Link, withRouter } from 'react-router-dom';

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
              {this.props.collections.map((collection) => {

                return (
                  <React.Fragment key={collection.slug}>
                    <Route path={`/collections/${collection.slug}`} exact component={collection.archive} />
                    <Route path={`/collections/${collection.slug}/:id`} component={collection.edit} />
                  </React.Fragment>
                );
              })}
            </DefaultTemplate>
          );
        }} />
      </Switch>
    );
  }
}

export default withRouter(connect(mapStateToProps)(Routes));
