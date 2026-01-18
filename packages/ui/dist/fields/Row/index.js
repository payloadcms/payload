'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { RenderFields } from '../../forms/RenderFields/index.js';
import { withCondition } from '../../forms/withCondition/index.js';
import { fieldBaseClass } from '../shared/index.js';
import './index.scss';
import { RowProvider } from './provider.js';
const baseClass = 'row';
const RowFieldComponent = props => {
  const {
    field: {
      admin: {
        className,
        style
      } = {},
      fields
    },
    forceRender = false,
    indexPath = '',
    parentPath = '',
    parentSchemaPath = '',
    permissions,
    readOnly
  } = props;
  return /*#__PURE__*/_jsx(RowProvider, {
    children: /*#__PURE__*/_jsx("div", {
      className: [fieldBaseClass, baseClass, className].filter(Boolean).join(' '),
      style: style || undefined,
      children: /*#__PURE__*/_jsx(RenderFields, {
        className: `${baseClass}__fields`,
        fields: fields,
        forceRender: forceRender,
        margins: false,
        parentIndexPath: indexPath,
        parentPath: parentPath,
        parentSchemaPath: parentSchemaPath,
        permissions: permissions,
        readOnly: readOnly
      })
    })
  });
};
export const RowField = withCondition(RowFieldComponent);
//# sourceMappingURL=index.js.map