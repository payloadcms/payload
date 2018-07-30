import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Dashboard from 'payload/client/components/views/Dashboard';
import collections from 'demo/collections';

class AdminTemplate extends Component {
  render() {
    const collectionsPath = 'collections';

    return (
      <div className="default-view">
        <Sidebar />
        <Route path="/" exact component={Dashboard} />
        {collections.map((collection) => {
          return (
            <React.Fragment key={collection.slug}>
              <Route path={`/${collectionsPath}/${collection.slug}`} exact component={collection.archive} />
              <Route path={`/${collectionsPath}/${collection.slug}/:id`} component={collection.edit} />
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}

export default AdminTemplate;
