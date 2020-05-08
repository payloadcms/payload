import React from 'react';
import Button from '../../elements/Button';
import DefaultTemplate from '../../templates/Default';

const { routes: { admin } } = PAYLOAD_CONFIG;

const NotFound = () => {
  return (
    <DefaultTemplate className="not-found">
      <h1>Nothing found</h1>
      <p>Sorry&mdash;there is nothing to correspond with your request.</p>
      <br />
      <Button
        el="link"
        to={`${admin}`}
      >
        Back to Dashboard
      </Button>
    </DefaultTemplate>
  );
};

export default NotFound;
