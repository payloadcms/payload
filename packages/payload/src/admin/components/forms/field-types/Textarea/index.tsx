import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { Props } from './types.js';

import { textarea } from '../../../../../fields/validations.js';
import { getTranslation } from '../../../../../utilities/getTranslation.js';
import { useConfig } from '../../../utilities/Config/index.js';
import { useLocale } from '../../../utilities/Locale/index.js';
import useField from '../../useField/index.js';
import withCondition from '../../withCondition/index.js';
import { isFieldRTL } from '../shared.js';
import TextareaInput from './Input.js';
import './index.scss';

const Textarea: React.FC<Props> = (props) => {
  const {
    admin: {
      className,
      condition,
      description,
      placeholder,
      readOnly,
      rows,
      rtl,
      style,
      width,
    } = {},
    label,
    localized,
    maxLength,
    minLength,
    name,
    path: pathFromProps,
    required,
    validate = textarea,
  } = props;

  const { i18n } = useTranslation();

  const path = pathFromProps || name;

  const locale = useLocale();

  const { localization } = useConfig();
  const isRTL = isFieldRTL({
    fieldLocalized: localized,
    fieldRTL: rtl,
    locale,
    localizationConfig: localization || undefined,
  });
  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, maxLength, minLength, required });
  }, [validate, required, maxLength, minLength]);

  const {
    errorMessage,
    setValue,
    showError,
    value,
  } = useField({
    condition,
    path,
    validate: memoizedValidate,
  });

  return (
    <TextareaInput
      onChange={(e) => {
        setValue(e.target.value);
      }}
      className={className}
      description={description}
      errorMessage={errorMessage}
      label={label}
      name={name}
      path={path}
      placeholder={getTranslation(placeholder, i18n)}
      readOnly={readOnly}
      required={required}
      rows={rows}
      rtl={isRTL}
      showError={showError}
      style={style}
      value={value as string}
      width={width}
    />
  );
};
export default withCondition(Textarea);
