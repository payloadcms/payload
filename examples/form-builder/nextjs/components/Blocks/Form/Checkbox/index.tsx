import React, { useState } from 'react';
import { CheckboxField } from 'payload-plugin-form-builder/dist/types';
import { UseFormRegister, FieldErrorsImpl, FieldValues } from 'react-hook-form';
import { Check } from '../../../icons/Check';
import { Error } from '../Error';
import { Width } from '../Width';

import classes from './index.module.scss';

export const Checkbox: React.FC<CheckboxField & {
  register: UseFormRegister<FieldValues & any>,
  setValue: any,
  getValues: any,
  errors: Partial<FieldErrorsImpl<{
    [x: string]: any;
  }>>
}> = ({ name, label, width, register, setValue, getValues, required: requiredFromProps, errors }) => {
  const [checked, setChecked] = useState(false);

  const isCheckboxChecked = getValues(name);

  return (
    <Width width={width}>
      <div
        className={[
          classes.checkbox,
          checked && classes.checked
        ].filter(Boolean).join(' ')}
      >
        <div className={classes.container}>
          <input
            type="checkbox"
            {...register(name, { required: requiredFromProps })}
            checked={isCheckboxChecked}
          />
          <button
            type="button"
            onClick={() => {
              setValue(name, !checked)
              setChecked(!checked)
            }}
          >
            <span className={classes.input}>
              <Check />
            </span>
          </button>
          <span className={classes.label}>{label}</span>
        </div>
        {requiredFromProps && errors[name] && checked === false && <Error />}
      </div>
    </Width>
  );
};
