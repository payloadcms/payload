import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';
import Button from '../Button';
import Crosshair from '../../graphics/Crosshair';

const baseClass = 'repeat-field-button';

const RepeatFieldButton = ({ onClick }) => {
  return (
    <div className={baseClass}>
      <Button
        onClick={onClick}
        type="secondary"
      >
        <Crosshair />
      </Button>
    </div>
  );
};

RepeatFieldButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default RepeatFieldButton;
