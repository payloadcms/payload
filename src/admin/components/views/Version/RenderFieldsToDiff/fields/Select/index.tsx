import React from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { useTranslation } from 'react-i18next';
import type { i18n as Ii18n } from 'i18next';
import Label from '../../Label';
import { diffStyles } from '../styles';
import { Props } from '../types';
import { getTranslation } from '../../../../../../../utilities/getTranslation';
import { OptionObject, SelectField } from '../../../../../../../fields/config/types';

import './index.scss';

const baseClass = 'select-diff';

const getOptionsToRender = (value: string, options: SelectField['options'], hasMany: boolean): string | OptionObject | (OptionObject | string)[] => {
  if (hasMany && Array.isArray(value)) {
    return value.map((val) => options.find((option) => (typeof option === 'string' ? option : option.value) === val) || String(val));
  }
  return options.find((option) => (typeof option === 'string' ? option : option.value) === value) || String(value);
};

const getTranslatedOptions = (options: string | OptionObject | (OptionObject | string)[], i18n: Ii18n): string => {
  if (Array.isArray(options)) {
    return options.map((option) => (typeof option === 'string' ? option : getTranslation(option.label, i18n))).join(', ');
  }
  return typeof options === 'string' ? options : getTranslation(options.label, i18n);
};

const Select: React.FC<Props> = ({ field, locale, version, comparison, diffMethod }) => {
  let placeholder = '';
  const { t, i18n } = useTranslation('general');

  if (version === comparison) placeholder = `[${t('noValue')}]`;

  const comparisonToRender = typeof comparison !== 'undefined' ? getTranslatedOptions(getOptionsToRender(comparison, field.options, field.hasMany), i18n) : placeholder;
  const versionToRender = typeof version !== 'undefined' ? getTranslatedOptions(getOptionsToRender(version, field.options, field.hasMany), i18n) : placeholder;

  return (
    <div className={baseClass}>
      <Label>
        {locale && (
          <span className={`${baseClass}__locale-label`}>{locale}</span>
        )}
        {getTranslation(field.label, i18n)}
      </Label>
      <ReactDiffViewer
        styles={diffStyles}
        compareMethod={DiffMethod[diffMethod]}
        oldValue={comparisonToRender}
        newValue={typeof versionToRender !== 'undefined' ? versionToRender : placeholder}
        splitView
        hideLineNumbers
        showDiffOnly={false}
      />
    </div>
  );
};

export default Select;
