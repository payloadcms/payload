import React from 'react';
import config from '../../../securedConfig';
import Button from '../../controls/Button';
import DefaultTemplate from '../../layout/DefaultTemplate';

const { routes: { admin } } = config;

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
