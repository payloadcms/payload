import React from 'react';
import { render } from 'react-dom';
import App from 'payload/client/components/App';

const Index = () => {
  return (
    <App />
  );
};

render(<Index />, document.getElementById('app'));
