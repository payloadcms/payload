import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './components/App';

const Index = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

render(<Index />, document.getElementById('app'));
