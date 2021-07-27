import React from 'react';
import { Props, isComponent } from './types';
import './index.scss';

const ViewDescription: React.FC<Props> = (props) => {
  const {
    description,
  } = props;

  if (isComponent(description)) {
    const Description = description;
    return <Description />;
  }

  if (description) {
    return (
      <div
        className="view-description"
      >
        {typeof description === 'function' ? description() : description}
      </div>
    );
  }

  return null;
};

export default ViewDescription;
