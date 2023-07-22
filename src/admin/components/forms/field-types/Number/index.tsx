import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useField from '../../useField';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import withCondition from '../../withCondition';
import { number } from '../../../../../fields/validations';
import { Props } from './types';
import { getTranslation } from '../../../../../utilities/getTranslation';
import { Option } from '../../../elements/ReactSelect/types';
import ReactSelect from '../../../elements/ReactSelect';

import './index.scss';
import { isNumber } from '../../../../../utilities/isNumber';

const NumberField: React.FC<Props> = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    validate = number,
    label,
    max,
    min,
    hasMany,
    minRows,
    maxRows,
    admin: {
      readOnly,
      style,
      className,
      width,
      step,
      placeholder,
      description,
      condition,
    } = {},
  } = props;

  const { t, i18n } = useTranslation();

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, min, max, required });
  }, [validate, min, max, required]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useField<number | number[]>({
    path,
    validate: memoizedValidate,
    condition,
  });

  const handleChange = useCallback((e) => {
    const val = parseFloat(e.target.value);

    if (Number.isNaN(val)) {
      setValue('');
    } else {
      setValue(val);
    }
  }, [setValue]);

  const classes = [
    'field-type',
    'number',
    className,
    showError && 'error',
    readOnly && 'read-only',
    hasMany && 'has-many',
  ].filter(Boolean).join(' ');

  const [valueToRender, setValueToRender] = useState<{label: string, value: {value: number}, id: string}[]>([]); // Only for hasMany

  const handleHasManyChange = useCallback((selectedOption) => {
    if (!readOnly) {
      let newValue;
      if (!selectedOption) {
        newValue = [];
      } else if (Array.isArray(selectedOption)) {
        newValue = selectedOption.map((option) => Number(option.value?.value || option.value));
      } else {
        newValue = [Number(selectedOption.value?.value || selectedOption.value)];
      }

      setValue(newValue);
    }
  }, [
    readOnly,
    setValue,
  ]);

  // useeffect update valueToRender:
  useEffect(() => {
    if (hasMany && Array.isArray(value)) {
      setValueToRender(value.map((val, index) => {
        return {
          label: `${val}`,
          value: {
            value: (val as any)?.value || val,
            toString: () => `${val}${index}`,
          }, // You're probably wondering, why the hell is this done that way? Well, React-select automatically uses "label-value" as a key, so we will get that react duplicate key warning if we just pass in the value as multiple values can be the same. So we need to append the index to the toString() of the value to avoid that warning, as it uses that as the key.
          id: `${val}${index}`, // append index to avoid duplicate keys but allow duplicate numbers
        };
      }));
    }
  }, [value, hasMany]);


  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <Error
        showError={showError}
        message={errorMessage}
      />
      <Label
        htmlFor={`field-${path.replace(/\./gi, '__')}`}
        label={label}
        required={required}
      />
      {hasMany ? (
        <ReactSelect
          className={`field-${path.replace(/\./gi, '__')}`}
          placeholder={t('general:enterAValue')}
          onChange={handleHasManyChange}
          value={valueToRender as Option[]}
          showError={showError}
          disabled={readOnly}
          options={[]}
          isCreatable
          isMulti
          isSortable
          isClearable
          filterOption={(option, rawInput) => {
            // eslint-disable-next-line no-restricted-globals
            return isNumber(rawInput)
          }}
          numberOnly
        />
      ) : (
        <input
          id={`field-${path.replace(/\./gi, '__')}`}
          value={typeof value === 'number' ? value : ''}
          onChange={handleChange}
          disabled={readOnly}
          placeholder={getTranslation(placeholder, i18n)}
          type="number"
          name={path}
          step={step}
          onWheel={(e) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            e.target.blur();
          }}
        />
      )}

      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(NumberField);
