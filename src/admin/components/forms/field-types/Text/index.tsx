import React, { useCallback } from 'react';
import useField from '../../useField';
import withCondition from '../../withCondition';
import { text } from '../../../../../fields/validations';
import { Props } from './types';
import TextInput from './Input';
import { useLabeledLocale } from '../../../utilities/Locale';
import { useConfig } from '../../../utilities/Config';
import { isFieldRTL } from '../shared';

const Text: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = text,
    label,
    minLength,
    maxLength,
    localized,
    admin: {
      placeholder,
      readOnly,
      style,
      className,
      width,
      description,
      condition,
      rtl,
    } = {},
    inputRef,
  } = props;

  const path = pathFromProps || name;
  const labeledLocale = useLabeledLocale();

  const { localization } = useConfig();
  const isRTL = isFieldRTL({
    fieldRTL: rtl,
    fieldLocalized: localized,
    labeledLocale,
    localizationConfig: localization || undefined,
  });


  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, minLength, maxLength, required });
  }, [validate, minLength, maxLength, required]);

  const field = useField<string>({
    path,
    validate: memoizedValidate,
    condition,
  });

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = field;

  return (
    <TextInput
      path={path}
      name={name}
      onChange={(e) => {
        setValue(e.target.value);
      }}
      showError={showError}
      errorMessage={errorMessage}
      required={required}
      label={label}
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      style={style}
      className={className}
      width={width}
      description={description}
      inputRef={inputRef}
      rtl={isRTL}
    />
  );
};

export default withCondition(Text);
