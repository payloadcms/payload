import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../controls/Button';

import './index.scss';

const HeadingButton = (props) => {
  const {
    heading, buttonType, buttonURL, buttonLabel,
  } = props;

  return (
    <header className="heading-button">
      <h1>{heading}</h1>
      <Button
        size="small"
        type="secondary"
        el={buttonType}
        url={buttonURL}
      >
        {buttonLabel}
      </Button>
    </header>
  );
};

HeadingButton.propTypes = {
  heading: PropTypes.string.isRequired,
  buttonType: PropTypes.string.isRequired,
  buttonURL: PropTypes.string.isRequired,
  buttonLabel: PropTypes.string.isRequired,
};

export default HeadingButton;
