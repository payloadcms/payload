import React, { useCallback } from 'react';

import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Error from '../../Error';
import Label from '../../Label';
import FieldDescription from '../../FieldDescription';
import RadioInput from './RadioInput';
import { radio } from '../../../../../fields/validations';
import { optionIsObject } from '../../../../../fields/config/types';
import { Props } from './types';

import './index.scss';

const baseClass = 'radio-group';

const RadioGroup: React.FC<Props> = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    validate = radio,
    label,
    admin: {
      readOnly,
      layout = 'horizontal',
      style,
      width,
      condition,
      description,
    } = {},
    options,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required, options });
    return validationResult;
  }, [validate, required, options]);

  const {
    value,
    showError,
    errorMessage,
    setValue,
  } = useFieldType({
    path,
    validate: memoizedValidate,
    condition,
  });

  const classes = [
    'field-type',
    baseClass,
    `${baseClass}--layout-${layout}`,
    showError && 'error',
    readOnly && `${baseClass}--read-only`,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__error-wrap`}>
        <Error
          showError={showError}
          message={errorMessage}
        />
      </div>
      <Label
        htmlFor={path}
        label={label}
        required={required}
      />
      <ul className={`${baseClass}--group`}>
        {options.map((option) => {
          let optionValue = '';

          if (optionIsObject(option)) {
            optionValue = option.value;
          } else {
            optionValue = option;
          }

          const isSelected = String(optionValue) === String(value);

          return (
            <li key={`${path} - ${optionValue}`}>
              <RadioInput
                path={path}
                isSelected={isSelected}
                option={optionIsObject(option) ? option : { label: option, value: option }}
                onChange={readOnly ? undefined : setValue}
              />
            </li>
          );
        })}
      </ul>
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(RadioGroup);
