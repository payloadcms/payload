import React from 'react';
import { Route } from 'react-router-dom';

const path = 'collections';

export default collections => {
  return collections.map((collection) => {
    return (
      <React.Fragment key={collection.slug}>
        <Route path={`/${path}/${collection.slug}`} exact component={collection.archive} />
        <Route path={`/${path}/${collection.slug}/:id`} component={collection.edit} />
      </React.Fragment>
    );
  });
};
