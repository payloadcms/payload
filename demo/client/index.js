import React from 'react';
import { render } from 'react-dom';
import { Route, Switch, Link } from 'react-router-dom';

import DefaultTemplate from 'payload/client/components/layout/DefaultTemplate';
import Dashboard from 'payload/client/components/views/Dashboard';
import Login from 'payload/client/components/views/Login';
import App from 'payload/client/components/App';

import collections from '../collections';
import store from './store';

const Index = () => {
  return (
    <App store={store}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/forgot" component={ () => { return <h1>Forgot Password</h1>; } } />
        <Route path="/" render={() => {
          return (
            <DefaultTemplate>
              <Route path="/" exact component={Dashboard} />
              {collections.map((collection) => {
                const collectionsPath = 'collections';

                return (
                  <React.Fragment key={collection.slug}>
                    <Route path={`/${collectionsPath}/${collection.slug}`} exact component={collection.archive} />
                    <Route path={`/${collectionsPath}/${collection.slug}/:id`} component={collection.edit} />
                  </React.Fragment>
                );
              })}
            </DefaultTemplate>
          );
        }} />
      </Switch>
      <Link to="/">Dashboard</Link>
    </App>
  );
};

render(<Index />, document.getElementById('app'));
