import React from 'react';
import { render } from 'react-dom';
import App from 'payload/client/components/App';
import Routes from './components/routes';

const Index = () => {
  return (
    <App>
      <Routes />
    </App>
  );
};

render(<Index />, document.getElementById('app'));
