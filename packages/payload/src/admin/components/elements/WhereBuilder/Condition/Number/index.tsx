import React from 'react';
import { useTranslation } from 'react-i18next';
import { Props } from './types';

import './index.scss';

const baseClass = 'condition-value-number';

const NumberField: React.FC<Props> = ({ onChange, value }) => {
  const { t } = useTranslation('general');
  return (
    <input
      placeholder={t('enterAValue')}
      className={baseClass}
      type="number"
      onChange={(e) => onChange(e.target.value)}
      value={value}
    />
  );
};

export default NumberField;
