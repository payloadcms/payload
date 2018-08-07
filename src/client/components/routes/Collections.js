import React from 'react';
import { Switch, Route } from 'react-router-dom';
import CollectionComponents from 'local/client/components/collections';

export default props => {
  return Object.keys(props.collections).map((key, i) => {
    return (
      <Switch key={i}>
        <Route path={`/collections/${key}/add-new`} exact component={CollectionComponents[key].
          Add} />
        <Route path={`/collections/${key}`} exact component={CollectionComponents[key].Archive} />
        <Route path={`/collections/${key}/:id`} component={CollectionComponents[key].Edit} />
      </Switch>
    );
  });
};
