import React from 'react';
import { Props } from './types';
import './index.scss';

const RenderFieldDescription: React.FC<Props> = (props) => {
  const {
    description,
    value,
    CustomComponent,
  } = props;

  if (CustomComponent) {
    return (
      <div
        className="field-description"
      >
        <CustomComponent value />
      </div>
    );
  }

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

export default RenderFieldDescription;
