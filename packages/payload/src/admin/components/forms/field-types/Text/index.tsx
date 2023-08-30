import React, { useCallback } from 'react';

import type { Props } from './types.js';

import { text } from '../../../../../fields/validations.js';
import { useConfig } from '../../../utilities/Config/index.js';
import { useLocale } from '../../../utilities/Locale/index.js';
import useField from '../../useField/index.js';
import withCondition from '../../withCondition/index.js';
import { isFieldRTL } from '../shared.js';
import TextInput from './Input.js';

const Text: React.FC<Props> = (props) => {
  const {
    admin: {
      className,
      condition,
      description,
      placeholder,
      readOnly,
      rtl,
      style,
      width,
    } = {},
    inputRef,
    label,
    localized,
    maxLength,
    minLength,
    name,
    path: pathFromProps,
    required,
    validate = text,
  } = props;

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
  }, [validate, minLength, maxLength, required]);

  const {
    errorMessage,
    setValue,
    showError,
    value,
  } = useField<string>({
    condition,
    path,
    validate: memoizedValidate,
  });

  return (
    <TextInput
      onChange={(e) => {
        setValue(e.target.value);
      }}
      className={className}
      description={description}
      errorMessage={errorMessage}
      inputRef={inputRef}
      label={label}
      name={name}
      path={path}
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      rtl={isRTL}
      showError={showError}
      style={style}
      value={value}
      width={width}
    />
  );
};

export default withCondition(Text);
