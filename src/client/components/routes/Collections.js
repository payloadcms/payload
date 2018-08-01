import React from 'react';
import { Switch, Route } from 'react-router-dom';

export default props => {
  return Object.keys(props.collections).map((key, i) => {
    return (
      <Switch key={i}>
        <Route path={`/collections/${key}/add-new`} exact component={props.collections[key].components.add} />
        <Route path={`/collections/${key}`} exact component={props.collections[key].components.archive} />
        <Route path={`/collections/${key}/:id`} component={props.collections[key].components.edit} />
      </Switch>
    );
  });
};
