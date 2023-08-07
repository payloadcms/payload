'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Props } from './types';
import { getTranslation } from '../../../../utilities/getTranslation';

import './index.scss';

const Label: React.FC<Props> = (props) => {
  const {
    label, required = false, htmlFor,
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
      </label>
    );
  }

  return null;
};

export default Label;
