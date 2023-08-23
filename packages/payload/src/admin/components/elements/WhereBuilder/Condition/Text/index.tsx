import React from 'react';
import { useTranslation } from 'react-i18next';
import { Props } from './types';

import './index.scss';

const baseClass = 'condition-value-text';

const Text: React.FC<Props> = ({ onChange, value }) => {
  const { t } = useTranslation('general');
  return (
    <input
      placeholder={t('enterAValue')}
      className={baseClass}
      type="text"
      onChange={(e) => onChange(e.target.value)}
      value={value || ''}
    />
  );
};

export default Text;
