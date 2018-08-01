import React from 'react';
import { Switch, Route } from 'react-router-dom';

export default props => {
  return props.collections.map((collection) => {
    return (
      <Switch key={collection.attrs.slug}>
        <Route path={`/collections/${collection.attrs.slug}/add-new`} exact component={collection.components.add} />
        <Route path={`/collections/${collection.attrs.slug}`} exact component={collection.components.archive} />
        <Route path={`/collections/${collection.attrs.slug}/:id`} component={collection.components.edit} />
      </Switch>
    );
  });
};
