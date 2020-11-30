import React from 'react';
import Tooltip from '../../elements/Tooltip';
import { Props } from './types';

import './index.scss';

const Error: React.FC<Props> = (props) => {
  const {
    showError = false,
    message = 'Please complete this field.',
  } = props;

  if (showError) {
    return (
      <Tooltip className="error-message">
        {message}
      </Tooltip>
    );
  }

  return null;
};

export default Error;
