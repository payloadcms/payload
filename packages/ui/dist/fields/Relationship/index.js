'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React, { useCallback, useMemo } from 'react';
import { useField } from '../../forms/useField/index.js';
import { withCondition } from '../../forms/withCondition/index.js';
import { mergeFieldStyles } from '../mergeFieldStyles.js';
import { RelationshipInput } from './Input.js';
import './index.scss';
export { RelationshipInput };
const RelationshipFieldComponent = props => {
  const {
    field,
    field: {
      admin: {
        allowCreate = true,
        allowEdit = true,
        appearance = 'select',
        className,
        description,
        isSortable = true,
        placeholder,
        sortOptions
      } = {},
      hasMany,
      label,
      localized,
      relationTo: relationToProp,
      required
    },
    path: pathFromProps,
    readOnly,
    validate
  } = props;
  const memoizedValidate = useCallback((value, validationOptions) => {
    if (typeof validate === 'function') {
      return validate(value, {
        ...validationOptions,
        required
      });
    }
  }, [validate, required]);
  const {
    customComponents: {
      AfterInput,
      BeforeInput,
      Description,
      Error,
      Label
    } = {},
    disabled,
    filterOptions,
    initialValue,
    path,
    setValue,
    showError,
    value: value_0
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  });
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  const isPolymorphic = Array.isArray(relationToProp);
  const [relationTo] = React.useState(() => Array.isArray(relationToProp) ? relationToProp : [relationToProp]);
  const handleChangeHasMulti = useCallback(newValue => {
    if (!newValue) {
      setValue(null, newValue === value_0);
      return;
    }
    let disableFormModification = false;
    if (isPolymorphic) {
      disableFormModification = Array.isArray(value_0) && Array.isArray(newValue) && value_0.length === newValue.length && value_0.every((val, idx) => {
        const newVal = newValue[idx];
        return val.value === newVal.value && val.relationTo === newVal.relationTo;
      });
    } else {
      disableFormModification = Array.isArray(value_0) && Array.isArray(newValue) && value_0.length === newValue.length && value_0.every((val_0, idx_0) => val_0 === newValue[idx_0].value);
    }
    const dataToSet = newValue.map(val_1 => {
      if (isPolymorphic) {
        return val_1;
      } else {
        return val_1.value;
      }
    });
    setValue(dataToSet, disableFormModification);
  }, [isPolymorphic, setValue, value_0]);
  const handleChangeSingle = useCallback(newValue_0 => {
    if (!newValue_0) {
      setValue(null, newValue_0 === value_0);
      return;
    }
    let disableFormModification_0 = false;
    if (isPolymorphic) {
      disableFormModification_0 = value_0 && newValue_0 && value_0.value === newValue_0.value && value_0.relationTo === newValue_0.relationTo;
    } else {
      disableFormModification_0 = value_0 && newValue_0 && value_0 === newValue_0.value;
    }
    const dataToSet_0 = isPolymorphic ? newValue_0 : newValue_0.value;
    setValue(dataToSet_0, disableFormModification_0);
  }, [isPolymorphic, setValue, value_0]);
  const memoizedValue = React.useMemo(() => {
    if (hasMany === true) {
      return Array.isArray(value_0) ? value_0.map(val_2 => {
        return isPolymorphic ? val_2 : {
          relationTo: Array.isArray(relationTo) ? relationTo[0] : relationTo,
          value: val_2
        };
      }) : value_0;
    } else {
      return value_0 ? isPolymorphic ? value_0 : {
        relationTo: Array.isArray(relationTo) ? relationTo[0] : relationTo,
        value: value_0
      } : value_0;
    }
  }, [hasMany, value_0, isPolymorphic, relationTo]);
  const memoizedInitialValue = React.useMemo(() => {
    if (hasMany === true) {
      return Array.isArray(initialValue) ? initialValue.map(val_3 => {
        return isPolymorphic ? val_3 : {
          relationTo: Array.isArray(relationTo) ? relationTo[0] : relationTo,
          value: val_3
        };
      }) : initialValue;
    } else {
      return initialValue ? isPolymorphic ? initialValue : {
        relationTo: Array.isArray(relationTo) ? relationTo[0] : relationTo,
        value: initialValue
      } : initialValue;
    }
  }, [initialValue, isPolymorphic, relationTo, hasMany]);
  return /*#__PURE__*/_jsx(RelationshipInput, {
    AfterInput: AfterInput,
    allowCreate: allowCreate,
    allowEdit: allowEdit,
    appearance: appearance,
    BeforeInput: BeforeInput,
    className: className,
    Description: Description,
    description: description,
    Error: Error,
    filterOptions: filterOptions,
    formatDisplayedOptions: isPolymorphic ? undefined : options => options.map(opt => opt.options).flat(),
    isSortable: isSortable,
    Label: Label,
    label: label,
    localized: localized,
    maxResultsPerRequest: 10,
    maxRows: field?.maxRows,
    minRows: field?.minRows,
    path: path,
    placeholder: placeholder,
    readOnly: readOnly || disabled,
    relationTo: relationTo,
    required: required,
    showError: showError,
    sortOptions: sortOptions,
    style: styles,
    ...(hasMany === true ? {
      hasMany: true,
      initialValue: memoizedInitialValue,
      onChange: handleChangeHasMulti,
      value: memoizedValue
    } : {
      hasMany: false,
      initialValue: memoizedInitialValue,
      onChange: handleChangeSingle,
      value: memoizedValue
    })
  });
};
export const RelationshipField = withCondition(RelationshipFieldComponent);
//# sourceMappingURL=index.js.map