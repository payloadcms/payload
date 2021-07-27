import React from 'react';
import { Props, isComponent } from './types';
import './index.scss';

const FieldDescription: React.FC<Props> = (props) => {
  const {
    description,
    value,
  } = props;


  if (isComponent(description)) {
    const Description = description;
    return <Description value={value} />;
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

export default FieldDescription;
