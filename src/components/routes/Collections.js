import React from 'react';
import { Switch, Route } from 'react-router-dom';

export default props => {
  return props.collections.map((collection, i) => {
    if (collection) {

      const Edit = props.modelViews[collection.slug].Edit;

      return (
        <Switch key={i}>
          <Route path={`/collections/${collection.slug}/create`} exact
            render={ routeProps => <Edit {...routeProps} action="create" /> } />

          <Route path={`/collections/${collection.slug}/:id`}
            render={ routeProps => <Edit {...routeProps} action="edit" /> } />

          <Route path={`/collections/${collection.slug}`} exact
            component={props.modelViews[collection.slug].Archive} />

        </Switch>
      );
    }

    return null;
  });
};
