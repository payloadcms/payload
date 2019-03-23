import React from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';

const mapState = state => ({
  config: state.common.config,
  collections: state.common.collections
})

const CollectionRoutes = props => {

  return (
    <Switch>
      <Route path={'/collections/:collectionSlug/create'} exact
        render={routeProps => {
          const { collectionSlug } = routeProps.match.params;
          const Edit = props.views[collectionSlug].Edit;
          return <Edit {...routeProps} collection={props.collections[collectionSlug]} config={props.config} />;
        }} />

      <Route path={'/collections/:collectionSlug/:id'} exact
        render={routeProps => {
          const { collectionSlug } = routeProps.match.params;
          const Edit = props.views[routeProps.match.params.collectionSlug].Edit;
          return <Edit {...routeProps} collection={props.collections[collectionSlug]} config={props.config} />;
        }} />

      <Route path={'/collections/:collectionSlug'} exact
        render={routeProps => {
          const { collectionSlug } = routeProps.match.params;
          const List = props.views[routeProps.match.params.collectionSlug].List;
          return <List {...routeProps} collection={props.collections[collectionSlug]} config={props.config} />;
        }} />
    </Switch>
  );
};

export default withRouter(connect(mapState)(CollectionRoutes));
