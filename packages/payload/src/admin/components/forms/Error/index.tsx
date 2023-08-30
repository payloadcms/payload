import React from 'react';
import Tooltip from '../../elements/Tooltip/index.js';
import { Props } from './types.js';

import './index.scss';

const baseClass = 'field-error';

const Error: React.FC<Props> = (props) => {
  const {
    showError = false,
    message,
  } = props;

  if (showError) {
    return (
      <Tooltip
        className={baseClass}
        delay={0}
      >
        {message}
      </Tooltip>
    );
  }

  return null;
};

export default Error;
