import React from 'react';
import { useTranslation } from 'react-i18next';
import { Props, isComponent } from './types';
import { getTranslation } from '../../../../utilities/getTranslation';

import './index.scss';

const ViewDescription: React.FC<Props> = (props) => {
  const { i18n } = useTranslation();
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
        {typeof description === 'function' ? description() : getTranslation(description, i18n) }
      </div>
    );
  }

  return null;
};

export default ViewDescription;
