import React from 'react';
import { Props, isComponent } from './types';
import './index.scss';

const baseClass = 'field-description';

const FieldDescription: React.FC<Props> = (props) => {
  const {
    className,
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
        className={[
          baseClass,
          className,
        ].filter(Boolean).join(' ')}
      >
        {typeof description === 'function' ? description({ value }) : description}
      </div>
    );
  }

  return null;
};

export default FieldDescription;
