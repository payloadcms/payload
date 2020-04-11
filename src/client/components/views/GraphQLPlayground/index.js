import React from 'react';
import { Provider } from 'react-redux';
import { Playground, store } from 'graphql-playground-react';
import config from '../../../securedConfig';

const GraphQLPlayground = () => {
  return (
    <Provider store={store}>
      <Playground endpoint={`${config.routes.api}${config.routes.graphQL}`} />
    </Provider>
  );
};

export default GraphQLPlayground;
