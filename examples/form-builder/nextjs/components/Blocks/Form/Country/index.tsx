import React from 'react';
import ReactSelect from 'react-select';
import { CountryField } from 'payload-plugin-form-builder/dist/types';
import { Controller, Control, FieldValues, FieldErrorsImpl } from 'react-hook-form';
import { countryOptions } from './options';
import { Error } from '../Error';
import { Width } from '../Width';

import classes from './index.module.scss';

export const Country: React.FC<CountryField & {
  control: Control<FieldValues, any>
  errors: Partial<FieldErrorsImpl<{
    [x: string]: any;
  }>>
}> = ({ name, label, width, control, required, errors }) => {
  return (
    <Width width={width}>
      <div className={classes.select}>
        <label htmlFor="name" className={classes.label}>
          {label}
        </label>
        <Controller
          control={control}
          rules={{ required }}
          name={name}
          defaultValue=""
          render={({ field: { onChange, value } }) => (
            <ReactSelect
              instanceId={name}
              options={countryOptions}
              value={countryOptions.find(c => c.value === value)}
              onChange={(val) => onChange(val.value)}
              className={classes.reactSelect}
              classNamePrefix="rs"
            />
          )}
        />
        {required && errors[name] && <Error />}
      </div>
    </Width>
  );
};
