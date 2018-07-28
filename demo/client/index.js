import React from 'react';
import { render } from 'react-dom';

import App from 'payload/client/components/App';

import './testStyles.css';

const Index = () => {
  return (
    <div>
      <App/>
    </div>
  )
}

render(<Index />, document.getElementById('app'));
