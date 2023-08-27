import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useField from '../../useField/index.js';
import withCondition from '../../withCondition/index.js';
import { textarea } from '../../../../../fields/validations.js';
import { Props } from './types.js';
import TextareaInput from './Input.js';
import { getTranslation } from '../../../../../utilities/getTranslation.js';
import { useLocale } from '../../../utilities/Locale/index.js';

import './index.scss';
import { useConfig } from '../../../utilities/Config/index.js';
import { isFieldRTL } from '../shared.js';

const Textarea: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = textarea,
    maxLength,
    minLength,
    localized,
    admin: {
      readOnly,
      style,
      className,
      width,
      placeholder,
      rows,
      description,
      condition,
      rtl,
    } = {},
    label,
  } = props;

  const { i18n } = useTranslation();

  const path = pathFromProps || name;

  const locale = useLocale();

  const { localization } = useConfig();
  const isRTL = isFieldRTL({
    fieldRTL: rtl,
    fieldLocalized: localized,
    locale,
    localizationConfig: localization || undefined,
  });
  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, required, maxLength, minLength });
  }, [validate, required, maxLength, minLength]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useField({
    path,
    validate: memoizedValidate,
    condition,
  });

  return (
    <TextareaInput
      path={path}
      name={name}
      onChange={(e) => {
        setValue(e.target.value);
      }}
      showError={showError}
      errorMessage={errorMessage}
      required={required}
      label={label}
      value={value as string}
      placeholder={getTranslation(placeholder, i18n)}
      readOnly={readOnly}
      style={style}
      className={className}
      width={width}
      description={description}
      rows={rows}
      rtl={isRTL}
    />
  );
};
export default withCondition(Textarea);
