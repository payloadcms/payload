'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Props } from './types';
import { getTranslation } from '../../../../utilities/getTranslation';

import './index.scss';
import Localized from '../../icons/Localized';

const Label: React.FC<Props> = (props) => {
  const {
    label, required = false, htmlFor, localized,
  } = props;
  const { i18n } = useTranslation();

  if (label) {
    return (
      <label
        htmlFor={htmlFor}
        className="field-label"
      >
        { getTranslation(label, i18n) }
        {required && <span className="required">*</span>}
        {localized && <Localized />}
      </label>
    );
  }

  return null;
};

export default Label;
