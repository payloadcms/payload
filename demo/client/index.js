import React from 'react';
import { render } from 'react-dom';

import App from 'payload/client/components/App';

import Routes from './Routes';
import store from './store';

const Index = () => {
  return (
    <App store={store}>
      <Routes />
    </App>
  );
};

render(<Index />, document.getElementById('app'));
