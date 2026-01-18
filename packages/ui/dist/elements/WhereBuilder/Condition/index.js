'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { useEffectEvent } from '../../../hooks/useEffectEvent.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { Button } from '../../Button/index.js';
import { ReactSelect } from '../../ReactSelect/index.js';
import { DefaultFilter } from './DefaultFilter/index.js';
import { getOperatorValueTypes } from './validOperators.js';
import './index.scss';
const baseClass = 'condition';
export const Condition = props => {
  const {
    addCondition,
    andIndex,
    fieldPath,
    filterOptions,
    operator,
    orIndex,
    reducedFields,
    removeCondition,
    RenderedFilter,
    updateCondition,
    value
  } = props;
  const {
    t
  } = useTranslation();
  const reducedField = reducedFields.find(field => field.value === fieldPath);
  const [internalValue, setInternalValue] = useState(value);
  const debouncedValue = useDebounce(internalValue, 300);
  const booleanSelect = ['exists'].includes(operator) || reducedField?.field?.type === 'checkbox';
  let valueOptions = [];
  if (booleanSelect) {
    valueOptions = [{
      label: t('general:true'),
      value: 'true'
    }, {
      label: t('general:false'),
      value: 'false'
    }];
  } else if (reducedField?.field && 'options' in reducedField.field) {
    valueOptions = reducedField.field.options;
  }
  const updateValue = useEffectEvent(async debouncedValue_0 => {
    if (operator) {
      await updateCondition({
        type: 'value',
        andIndex,
        field: reducedField,
        operator,
        orIndex,
        value: debouncedValue_0 === null || debouncedValue_0 === '' ? undefined : debouncedValue_0
      });
    }
  });
  useEffect(() => {
    void updateValue(debouncedValue);
  }, [debouncedValue]);
  const disabled = !reducedField?.value && typeof reducedField?.value !== 'number' || reducedField?.field?.admin?.disableListFilter;
  const handleFieldChange = useCallback(async field_0 => {
    setInternalValue(undefined);
    await updateCondition({
      type: 'field',
      andIndex,
      field: reducedFields.find(option => option.value === field_0.value),
      operator,
      orIndex,
      value: undefined
    });
  }, [andIndex, operator, orIndex, reducedFields, updateCondition]);
  const handleOperatorChange = useCallback(async operator_0 => {
    const operatorValueTypes = getOperatorValueTypes(reducedField.field.type);
    const validOperatorValue = operatorValueTypes[operator_0.value] || 'any';
    const isValidValue = validOperatorValue === 'any' || typeof value === validOperatorValue || validOperatorValue === 'boolean' && (value === 'true' || value === 'false');
    if (!isValidValue) {
      // if the current value is not valid for the new operator
      // reset the value before passing it to updateCondition
      setInternalValue(undefined);
    }
    await updateCondition({
      type: 'operator',
      andIndex,
      field: reducedField,
      operator: operator_0.value,
      orIndex,
      value: isValidValue ? value : undefined
    });
  }, [andIndex, reducedField, orIndex, updateCondition, value]);
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    children: /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__wrap`,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__inputs`,
        children: [/*#__PURE__*/_jsx("div", {
          className: `${baseClass}__field`,
          children: /*#__PURE__*/_jsx(ReactSelect, {
            disabled: disabled,
            filterOption: (option_0, inputValue) => (option_0?.data?.plainTextLabel || option_0.label).toLowerCase().includes(inputValue.toLowerCase()),
            isClearable: false,
            onChange: handleFieldChange,
            options: reducedFields.filter(field_1 => !field_1.field.admin.disableListFilter),
            value: reducedField || {
              value: reducedField?.value
            }
          })
        }), /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__operator`,
          children: /*#__PURE__*/_jsx(ReactSelect, {
            disabled: disabled,
            isClearable: false,
            onChange: handleOperatorChange,
            options: reducedField?.operators,
            value: reducedField?.operators.find(o => operator === o.value) || null
          })
        }), /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__value`,
          children: RenderedFilter || /*#__PURE__*/_jsx(DefaultFilter, {
            booleanSelect: booleanSelect,
            disabled: !operator || !reducedField || reducedField?.field?.admin?.disableListFilter,
            filterOptions: filterOptions,
            internalField: reducedField,
            onChange: setInternalValue,
            operator: operator,
            options: valueOptions,
            value: internalValue ?? ''
          })
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__actions`,
        children: [/*#__PURE__*/_jsx(Button, {
          buttonStyle: "icon-label",
          className: `${baseClass}__actions-remove`,
          icon: "x",
          iconStyle: "with-border",
          onClick: () => removeCondition({
            andIndex,
            orIndex
          }),
          round: true
        }), /*#__PURE__*/_jsx(Button, {
          buttonStyle: "icon-label",
          className: `${baseClass}__actions-add`,
          icon: "plus",
          iconStyle: "with-border",
          onClick: () => addCondition({
            andIndex: andIndex + 1,
            field: reducedFields.find(field_2 => !field_2.field.admin?.disableListFilter),
            orIndex,
            relation: 'and'
          }),
          round: true
        })]
      })]
    })
  });
};
//# sourceMappingURL=index.js.map