import React from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';

const mapState = state => ({
  config: state.common.config
})

const CollectionRoutes = props => {

  if (props.config) {
    return props.collections.map((collection, i) => {
      if (collection) {

        const Edit = props.views[collection.slug].Edit;
        const Archive = props.views[collection.slug].Archive;

        return (
          <Switch key={i}>
            <Route path={`/collections/${collection.slug}/create`} exact
              render={routeProps => <Edit {...routeProps} collection={collection} config={props.config} />} />

            <Route path={`/collections/${collection.slug}/:slug`}
              render={routeProps => <Edit {...routeProps} collection={collection} config={props.config} />} />

            <Route path={`/collections/${collection.slug}`} exact
              render={routeProps => <Archive {...routeProps} collection={collection} config={props.config} />} />
          </Switch>
        );
      }

      return null;
    });
  }

  return null;
};

export default withRouter(connect(mapState)(CollectionRoutes));
