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
    return <Description value={formatOptions ? new Intl.NumberFormat(i18n.language, formatOptions).format(value as number) : value} />;
  }

  if (description) {
    return (
      <div
        className={[
          baseClass,
          className,
        ].filter(Boolean).join(' ')}
      >
        {typeof description === 'function' ? description({ value: formatOptions ? new Intl.NumberFormat(i18n.language, formatOptions).format(value as number) : value }) : getTranslation(description, i18n)}
      </div>
    );
  }

  if (formatOptions) {
    return (
      <div
        className={[
          baseClass,
          className,
        ].filter(Boolean).join(' ')}
      >
        {new Intl.NumberFormat(i18n.language, formatOptions).format(value as number)}
      </div>
    );
  }

  return null;
};

export default FieldDescription;
