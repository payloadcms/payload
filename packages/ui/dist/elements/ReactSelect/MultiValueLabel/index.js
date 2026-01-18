'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { components as SelectComponents } from 'react-select';
import { useTranslation } from '../../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'multi-value-label';
export const MultiValueLabel = props => {
  const {
    data,
    selectProps: t0
  } = props;
  const {
    customProps: t1
  } = t0 === undefined ? {} : t0;
  const {
    draggableProps,
    editableProps
  } = t1 === undefined ? {} : t1;
  const {
    i18n
  } = useTranslation();
  const className = `${baseClass}__text`;
  const labelText = data.label ? getTranslation(data.label, i18n) : "";
  const titleText = typeof labelText === "string" ? labelText : "";
  return _jsx("div", {
    className: baseClass,
    title: titleText,
    children: _jsx(SelectComponents.MultiValueLabel, {
      ...props,
      innerProps: {
        className,
        ...(editableProps && editableProps(data, className, props.selectProps) || {}),
        ...(draggableProps || {})
      }
    })
  });
};
//# sourceMappingURL=index.js.map