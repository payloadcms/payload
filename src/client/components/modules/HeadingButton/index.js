import React from 'react';
import Button from 'payload/client/components/controls/Button';

import './index.css';

export default props => {
  return (
    <header className="heading-button">
      <h1>{props.heading}</h1>
      <Button size="small" type="secondary" el={props.buttonType} url={props.buttonUrl}>{props.buttonLabel}</Button>
    </header>
  );
};
