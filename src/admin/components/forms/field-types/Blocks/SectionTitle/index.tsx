import React from 'react';
import { useTranslation } from 'react-i18next';
import useField from '../../../useField';
import { Props } from './types';

import './index.scss';

const baseClass = 'section-title';

const SectionTitle: React.FC<Props> = (props) => {
  const { path, readOnly } = props;

  const { value, setValue } = useField({ path });
  const { t } = useTranslation('general');

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      data-value={value}
    >
      <input
        className={`${baseClass}__input`}
        id={path}
        value={value as string || ''}
        placeholder={t('untitled')}
        type="text"
        name={path}
        onChange={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setValue(e.target.value);
        }}
        readOnly={readOnly}
      />
    </div>
  );
};

export default SectionTitle;
