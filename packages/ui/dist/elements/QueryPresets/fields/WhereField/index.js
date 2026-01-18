'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { toWords } from 'payload/shared';
import React from 'react';
import { FieldLabel } from '../../../../fields/FieldLabel/index.js';
import { useField } from '../../../../forms/useField/index.js';
import { useConfig } from '../../../../providers/Config/index.js';
import { useListQuery } from '../../../../providers/ListQuery/index.js';
import { useTranslation } from '../../../../providers/Translation/index.js';
import { Pill } from '../../../Pill/index.js';
import './index.scss';
/** @todo: improve this */
const transformWhereToNaturalLanguage = (where, collectionLabel) => {
  if (!where) {
    return null;
  }
  const renderCondition = condition => {
    if (!condition || typeof condition !== 'object') {
      return 'No where query';
    }
    const key = Object.keys(condition)[0];
    if (!key || !condition[key] || typeof condition[key] !== 'object') {
      return 'No where query';
    }
    const operator = Object.keys(condition[key])[0];
    const operatorValue = condition[key][operator];
    // Format value - ideally would use field schema for proper typing
    const formatValue = val => {
      if (typeof val === 'object' && val != null) {
        try {
          return new Date(val).toLocaleDateString();
        } catch {
          return 'Unknown error has occurred';
        }
      }
      return val?.toString() ?? '';
    };
    const value = Array.isArray(operatorValue) ? operatorValue.map(formatValue).join(', ') : formatValue(operatorValue);
    return /*#__PURE__*/_jsxs(Pill, {
      pillStyle: "always-white",
      size: "small",
      children: [/*#__PURE__*/_jsx("b", {
        children: toWords(key)
      }), " ", operator, " ", /*#__PURE__*/_jsx("b", {
        children: toWords(value)
      })]
    });
  };
  const renderWhere = (where, collectionLabel) => {
    if (where.or && where.or.length > 0) {
      return /*#__PURE__*/_jsx("div", {
        className: "or-condition",
        children: where.or.map((orCondition, orIndex) => /*#__PURE__*/_jsx(React.Fragment, {
          children: orCondition.and && orCondition.and.length > 0 ? /*#__PURE__*/_jsxs("div", {
            className: "and-condition",
            children: [orIndex === 0 && /*#__PURE__*/_jsx("span", {
              className: "label",
              children: `Filter ${collectionLabel} where `
            }), orIndex > 0 && /*#__PURE__*/_jsx("span", {
              className: "label",
              children: " or "
            }), orCondition.and.map((andCondition, andIndex) => /*#__PURE__*/_jsxs(React.Fragment, {
              children: [renderCondition(andCondition), andIndex < orCondition.and.length - 1 && /*#__PURE__*/_jsx("span", {
                className: "label",
                children: " and "
              })]
            }, andIndex))]
          }) : renderCondition(orCondition)
        }, orIndex))
      });
    }
    return renderCondition(where);
  };
  return renderWhere(where, collectionLabel);
};
export const QueryPresetsWhereField = t0 => {
  const {
    field: t1
  } = t0;
  const {
    label,
    required
  } = t1;
  const {
    path,
    value
  } = useField();
  const {
    collectionSlug
  } = useListQuery();
  const {
    getEntityConfig
  } = useConfig();
  const collectionConfig = getEntityConfig({
    collectionSlug
  });
  const {
    i18n
  } = useTranslation();
  return _jsxs("div", {
    className: "field-type query-preset-where-field",
    children: [_jsx(FieldLabel, {
      as: "h3",
      label,
      path,
      required
    }), _jsx("div", {
      className: "value-wrapper",
      children: value ? transformWhereToNaturalLanguage(value, getTranslation(collectionConfig?.labels?.plural, i18n)) : "No where query"
    })]
  });
};
//# sourceMappingURL=index.js.map