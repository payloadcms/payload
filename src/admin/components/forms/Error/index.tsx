import React from 'react';
import Tooltip from '../../elements/Tooltip';
import { Props } from './types';

import './index.scss';

const baseClass = 'field-error';

const Error: React.FC<Props> = (props) => {
  const {
    showError = false,
    message,
  } = props;

  if (showError) {
    return (
      <Tooltip className={baseClass}>
        {message}
      </Tooltip>
    );
  }

  return null;
};

export default Error;
