import React from 'react';
import { render } from 'react-dom';

import Sidebar from '../src/client/components/Sidebar';

import './testStyles.css';

const App = () => {
  return (
    <div>
      <Sidebar />
      <h3>Payload</h3>
      <p>Yay test</p>
    </div>
  )
}

render(<App />, document.getElementById('app'));
