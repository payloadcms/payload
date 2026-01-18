'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { components as SelectComponents } from 'react-select';
import { useTranslation } from '../../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'value-container';
export const ValueContainer = props => {
  const {
    selectProps: t0
  } = props;
  const {
    customProps,
    value
  } = t0 === undefined ? {} : t0;
  const {
    i18n
  } = useTranslation();
  let titleText = "";
  if (value && !Array.isArray(value) && typeof value === "object" && "label" in value) {
    const labelText = value.label ? getTranslation(value.label, i18n) : "";
    titleText = typeof labelText === "string" ? labelText : "";
  }
  return _jsxs("div", {
    className: baseClass,
    ref: customProps?.droppableRef,
    title: titleText,
    children: [customProps?.valueContainerLabel && _jsx("span", {
      className: `${baseClass}__label`,
      children: customProps?.valueContainerLabel
    }), _jsx(SelectComponents.ValueContainer, {
      ...props
    })]
  });
};
//# sourceMappingURL=index.js.map