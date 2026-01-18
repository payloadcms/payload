'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { optionIsObject } from 'payload/shared';
import React, { useCallback, useMemo } from 'react';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { FieldDescription } from '../../fields/FieldDescription/index.js';
import { FieldError } from '../../fields/FieldError/index.js';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import { useForm } from '../../forms/Form/context.js';
import { useField } from '../../forms/useField/index.js';
import { withCondition } from '../../forms/withCondition/index.js';
import { mergeFieldStyles } from '../mergeFieldStyles.js';
import './index.scss';
import { fieldBaseClass } from '../shared/index.js';
import { Radio } from './Radio/index.js';
const baseClass = 'radio-group';
const RadioGroupFieldComponent = props => {
  const {
    disableModifyingForm: disableModifyingFormFromProps,
    field,
    field: {
      admin: {
        className,
        description,
        layout = 'horizontal'
      } = {},
      label,
      localized,
      options = [],
      required
    } = {},
    onChange: onChangeFromProps,
    path: pathFromProps,
    readOnly,
    validate,
    value: valueFromProps
  } = props;
  const {
    uuid
  } = useForm();
  const memoizedValidate = useCallback((value, validationOptions) => {
    if (typeof validate === 'function') {
      return validate(value, {
        ...validationOptions,
        options,
        required
      });
    }
  }, [validate, options, required]);
  const {
    customComponents: {
      AfterInput,
      BeforeInput,
      Description,
      Error,
      Label
    } = {},
    disabled,
    path,
    setValue,
    showError,
    value: valueFromContext
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  });
  const value_0 = valueFromContext || valueFromProps;
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass, className, `${baseClass}--layout-${layout}`, showError && 'error', (readOnly || disabled) && `${baseClass}--read-only`].filter(Boolean).join(' '),
    style: styles,
    children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Error,
      Fallback: /*#__PURE__*/_jsx(FieldError, {
        path: path,
        showError: showError
      })
    }), /*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Label,
      Fallback: /*#__PURE__*/_jsx(FieldLabel, {
        label: label,
        localized: localized,
        path: path,
        required: required
      })
    }), /*#__PURE__*/_jsxs("div", {
      className: `${fieldBaseClass}__wrap`,
      children: [BeforeInput, /*#__PURE__*/_jsx("ul", {
        className: `${baseClass}--group`,
        id: `field-${path.replace(/\./g, '__')}`,
        children: options.map(option => {
          let optionValue = '';
          if (optionIsObject(option)) {
            optionValue = option.value;
          } else {
            optionValue = option;
          }
          const isSelected = String(optionValue) === String(value_0);
          const id = `field-${path}-${optionValue}${uuid ? `-${uuid}` : ''}`;
          return /*#__PURE__*/_jsx("li", {
            children: /*#__PURE__*/_jsx(Radio, {
              id: id,
              isSelected: isSelected,
              onChange: () => {
                if (typeof onChangeFromProps === 'function') {
                  onChangeFromProps(optionValue);
                }
                if (!(readOnly || disabled)) {
                  setValue(optionValue, !!disableModifyingFormFromProps);
                }
              },
              option: optionIsObject(option) ? option : {
                label: option,
                value: option
              },
              path: path,
              readOnly: readOnly || disabled,
              uuid: uuid
            })
          }, `${path} - ${optionValue}`);
        })
      }), AfterInput, /*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Description,
        Fallback: /*#__PURE__*/_jsx(FieldDescription, {
          description: description,
          path: path
        })
      })]
    })]
  });
};
export const RadioGroupField = withCondition(RadioGroupFieldComponent);
//# sourceMappingURL=index.js.map