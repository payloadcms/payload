import React from 'react';
import { useTranslation } from 'react-i18next';
import { Props } from './types';
import './index.scss';
import { getTranslation } from '../../../utilities/getTranslation';

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
