import React from 'react';
import { Provider } from 'react-redux';
import { Playground, store } from 'graphql-playground-react';
import config from '../../../securedConfig';
import { getJWTHeader } from '../../../api';

const GraphQLPlayground = () => {
  const headers = getJWTHeader();
  const endpoint = `${config.serverURL}${config.routes.api}${config.routes.graphQL}`;

  return (
    <Provider store={store}>
      <link
        href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700|Source+Code+Pro:400,700"
        rel="stylesheet"
      />
      <Playground
        headers={headers}
        endpoint={endpoint}
      />
    </Provider>
  );
};

export default GraphQLPlayground;
