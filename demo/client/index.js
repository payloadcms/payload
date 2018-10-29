import React from 'react';
import { render } from 'react-dom';
import { App } from 'payload/components';
import Routes from './components/Routes';
import Content from './components/Content';
import store from './store';

const Index = () => {
  return (
    <App store={store}>
      <Routes />
      <Content />
    </App>
  );
};

render(<Index />, document.getElementById('app'));
