import React from 'react';
import { useTranslation } from 'react-i18next';
import { Props, isComponent } from './types';
import { getTranslation } from '../../../../utilities/getTranslation';
import './index.scss';

const baseClass = 'field-description';

const FieldDescription: React.FC<Props> = (props) => {
  const {
    className,
    description,
    value,
    formatOptions,
  } = props;

  const { i18n } = useTranslation();

  if (isComponent(description)) {
    const Description = description;
    return (
      <Description
        value={formatOptions}
        language={i18n.language}
      />
    );
  }

  if (description) {
    return (
      <div
        className={[
          baseClass,
          className,
        ].filter(Boolean).join(' ')}
      >
        {typeof description === 'function' ? description({
          value,
          language: i18n.language,
        }) : getTranslation(description, i18n)}
      </div>
    );
  }

  return null;
};

export default FieldDescription;
