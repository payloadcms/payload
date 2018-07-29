import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import authRoutes from 'payload/client/components/routes/auth';
import collectionRoutes from 'payload/client/components/routes/collections';
import Dashboard from 'payload/client/components/views/Dashboard';

import collections from '../../collections';

class Routes extends Component {
  render() {
    return (
      <React.Fragment>
        <Route path="/" exact component={Dashboard} />
        { authRoutes() }
        { collectionRoutes(collections) }
      </React.Fragment>
    );
  }
}

export default Routes;
