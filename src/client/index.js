import React from 'react';
import { render } from 'react-dom';

import './testStyles.css';

const App = () => {
  return (
    <div>
      <h3>Payload</h3>
      <p>Yay</p>
    </div>
  )
}

render(<App />, document.getElementById('app'));
