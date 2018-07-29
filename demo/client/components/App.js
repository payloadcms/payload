import React, { Component } from 'react';
import { Switch, withRouter, Route } from 'react-router-dom';

import MeasureScroll from 'payload/client/components/utilities/MeasureScroll';
import Login from 'payload/client/components/views/Login';

import 'payload/client/scss/app.css';

class App extends Component {
  render() {
    return (
      <React.Fragment>
        <MeasureScroll />
        <Switch location={this.props.location}>
          <Route exact path="/" component={Login} />
        </Switch>
      </React.Fragment>
    );
  }
}

export default withRouter(App);
