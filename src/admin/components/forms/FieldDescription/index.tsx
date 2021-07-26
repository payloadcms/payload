import React from 'react';
import { Props } from './types';
import './index.scss';

const FieldDescription: React.FC<Props> = (props) => {
  const {
    description,
    value,
  } = props;

  if (description) {
    return (
      <div
        className="field-description"
      >
        {typeof description === 'function' ? description({ value }) : description}
      </div>
    );
  }

  return null;
};

export default FieldDescription;
