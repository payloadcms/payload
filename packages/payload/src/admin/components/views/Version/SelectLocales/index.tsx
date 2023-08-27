import React from 'react';
import { useTranslation } from 'react-i18next';
import ReactSelect from '../../../elements/ReactSelect.js';
import { Props } from './types.js';

import './index.scss';

const baseClass = 'select-version-locales';

const SelectLocales: React.FC<Props> = ({ onChange, value, options }) => {
  const { t } = useTranslation('version');

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__label`}>
        {t('showLocales')}
      </div>
      <ReactSelect
        isMulti
        placeholder={t('selectLocales')}
        onChange={onChange}
        value={value.map(({ code }) => ({ value: code, label: code }))}
        options={options.map(({ code }) => ({ value: code, label: code }))}
      />
    </div>
  );
};

export default SelectLocales;
