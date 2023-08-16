import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReactSelect } from '../../../elements/ReactSelect';
import { Props } from './types';

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
        value={value}
        options={options}
      />
    </div>
  );
};

export default SelectLocales;
