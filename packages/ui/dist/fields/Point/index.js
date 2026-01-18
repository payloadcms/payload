'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React, { useCallback, useMemo } from 'react';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { FieldDescription } from '../../fields/FieldDescription/index.js';
import { FieldError } from '../../fields/FieldError/index.js';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import { useField } from '../../forms/useField/index.js';
import { withCondition } from '../../forms/withCondition/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { mergeFieldStyles } from '../mergeFieldStyles.js';
import './index.scss';
import { fieldBaseClass } from '../shared/index.js';
const baseClass = 'point';
export const PointFieldComponent = props => {
  const {
    field,
    field: {
      admin: {
        className,
        description,
        placeholder,
        step
      } = {},
      label,
      localized,
      required
    },
    path: pathFromProps,
    readOnly,
    validate
  } = props;
  const {
    i18n,
    t
  } = useTranslation();
  const memoizedValidate = useCallback((value, options) => {
    if (typeof validate === 'function') {
      return validate(value, {
        ...options,
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
    path,
    setValue,
    showError,
    value: value_0 = [null, null]
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  });
  const handleChange = useCallback((e, index) => {
    let val = parseFloat(e.target.value);
    if (Number.isNaN(val)) {
      val = e.target.value;
    }
    const coordinates = [...value_0];
    coordinates[index] = val;
    setValue(coordinates);
  }, [setValue, value_0]);
  const getCoordinateFieldLabel = type => {
    const suffix = type === 'longitude' ? t('fields:longitude') : t('fields:latitude');
    const fieldLabel = label ? getTranslation(label, i18n) : '';
    return `${fieldLabel}${fieldLabel ? ' - ' : ''}${suffix}`;
  };
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass, className, showError && 'error', (readOnly || disabled) && 'read-only'].filter(Boolean).join(' '),
    style: styles,
    children: [/*#__PURE__*/_jsxs("ul", {
      className: `${baseClass}__wrap`,
      children: [/*#__PURE__*/_jsxs("li", {
        children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
          CustomComponent: Label,
          Fallback: /*#__PURE__*/_jsx(FieldLabel, {
            label: getCoordinateFieldLabel('longitude'),
            localized: localized,
            path: path,
            required: required
          })
        }), /*#__PURE__*/_jsxs("div", {
          className: "input-wrapper",
          children: [BeforeInput, /*#__PURE__*/_jsx("input", {
            disabled: readOnly || disabled,
            id: `field-longitude-${path?.replace(/\./g, '__')}`,
            name: `${path}.longitude`,
            onChange: e_0 => handleChange(e_0, 0),
            placeholder: getTranslation(placeholder, i18n),
            step: step,
            type: "number",
            value: value_0 && typeof value_0[0] === 'number' ? value_0[0] : ''
          }), AfterInput]
        })]
      }), /*#__PURE__*/_jsxs("li", {
        children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
          CustomComponent: Label,
          Fallback: /*#__PURE__*/_jsx(FieldLabel, {
            label: getCoordinateFieldLabel('latitude'),
            localized: localized,
            path: path,
            required: required
          })
        }), /*#__PURE__*/_jsxs("div", {
          className: "input-wrapper",
          children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
            CustomComponent: Error,
            Fallback: /*#__PURE__*/_jsx(FieldError, {
              path: path,
              showError: showError
            })
          }), BeforeInput, /*#__PURE__*/_jsx("input", {
            disabled: readOnly || disabled,
            id: `field-latitude-${path?.replace(/\./g, '__')}`,
            name: `${path}.latitude`,
            onChange: e_1 => handleChange(e_1, 1),
            placeholder: getTranslation(placeholder, i18n),
            step: step,
            type: "number",
            value: value_0 && typeof value_0[1] === 'number' ? value_0[1] : ''
          }), AfterInput]
        })]
      })]
    }), /*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Description,
      Fallback: /*#__PURE__*/_jsx(FieldDescription, {
        description: description,
        path: path
      })
    })]
  });
};
export const PointField = withCondition(PointFieldComponent);
//# sourceMappingURL=index.js.map