import React from 'react';
import { Switch, Route } from 'react-router-dom';
import CollectionComponents from 'local/client/components/collections';

export default props => {
  return props.collections.map((collection, i) => {
    if (collection) {
      return (
        <Switch key={i}>
          <Route path={`/collections/${collection.slug}/add-new`} exact component={CollectionComponents[collection.slug].Add} />
          <Route path={`/collections/${collection.slug}`} exact component={CollectionComponents[collection.slug].Archive} />
          <Route path={`/collections/${collection.slug}/:id`} component={CollectionComponents[collection.slug].Edit} />
        </Switch>
      );
    }

    return null;
  });
};
