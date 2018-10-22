import React from 'react';
import { Switch, Route } from 'react-router-dom';

export default props => {
  return props.collections.map((collection, i) => {
    if (collection) {
      return (
        <Switch key={i}>
          <Route path={`/collections/${collection.slug}/add-new`} exact component={props.modelViews[collection.slug].Add} />
          <Route path={`/collections/${collection.slug}`} exact component={props.modelViews[collection.slug].Archive} />
          <Route path={`/collections/${collection.slug}/:id`} component={props.modelViews[collection.slug].Edit} />
        </Switch>
      );
    }

    return null;
  });
};
