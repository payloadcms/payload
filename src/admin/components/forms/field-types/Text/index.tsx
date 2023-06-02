import React, { useCallback } from 'react';
import useField from '../../useField';
import withCondition from '../../withCondition';
import { text } from '../../../../../fields/validations';
import { Props } from './types';
import TextInput from './Input';
import { useLabeledLocale } from '../../../utilities/Locale';

const Text: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = text,
    label,
    minLength,
    maxLength,
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
  // field id rtl when current locale is rtl and admin.rtl is true also
  const isRTL = (rtl && labeledLocale && labeledLocale.rtl) || false;

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
