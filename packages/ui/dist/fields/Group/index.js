'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { groupHasName } from 'payload/shared';
import React, { useMemo } from 'react';
import { useCollapsible } from '../../elements/Collapsible/provider.js';
import { ErrorPill } from '../../elements/ErrorPill/index.js';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { FieldDescription } from '../../fields/FieldDescription/index.js';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import { useFormSubmitted } from '../../forms/Form/context.js';
import { RenderFields } from '../../forms/RenderFields/index.js';
import { useField } from '../../forms/useField/index.js';
import { withCondition } from '../../forms/withCondition/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { mergeFieldStyles } from '../mergeFieldStyles.js';
import './index.scss';
import { useRow } from '../Row/provider.js';
import { fieldBaseClass } from '../shared/index.js';
import { useTabs } from '../Tabs/provider.js';
import { GroupProvider, useGroup } from './provider.js';
const baseClass = 'group-field';
export const GroupFieldComponent = props => {
  const {
    field,
    field: {
      admin: {
        className,
        description,
        hideGutter
      } = {},
      fields,
      label
    },
    indexPath,
    parentPath,
    parentSchemaPath,
    path,
    permissions,
    readOnly,
    schemaPath: schemaPathFromProps
  } = props;
  const schemaPath = schemaPathFromProps ?? (field.type === 'group' && groupHasName(field) ? field.name : path);
  const {
    i18n
  } = useTranslation();
  const {
    isWithinCollapsible
  } = useCollapsible();
  const isWithinGroup = useGroup();
  const isWithinRow = useRow();
  const isWithinTab = useTabs();
  const {
    customComponents: {
      AfterInput,
      BeforeInput,
      Description,
      Label
    } = {},
    errorPaths
  } = useField({
    path
  });
  const submitted = useFormSubmitted();
  const errorCount = errorPaths.length;
  const fieldHasErrors = submitted && errorCount > 0;
  const isTopLevel = !(isWithinCollapsible || isWithinGroup || isWithinRow);
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass, isTopLevel && `${baseClass}--top-level`, isWithinCollapsible && `${baseClass}--within-collapsible`, isWithinGroup && `${baseClass}--within-group`, isWithinRow && `${baseClass}--within-row`, isWithinTab && `${baseClass}--within-tab`, !hideGutter && isWithinGroup && `${baseClass}--gutter`, fieldHasErrors && `${baseClass}--has-error`, className].filter(Boolean).join(' '),
    id: `field-${path?.replace(/\./g, '__')}`,
    style: styles,
    children: [/*#__PURE__*/_jsx(GroupProvider, {
      children: /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__wrap`,
        children: [Boolean(Label || Description || label || fieldHasErrors) && /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__header`,
          children: [Boolean(Label || Description || label) && /*#__PURE__*/_jsxs("header", {
            children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
              CustomComponent: Label,
              Fallback: /*#__PURE__*/_jsx("h3", {
                className: `${baseClass}__title`,
                children: /*#__PURE__*/_jsx(FieldLabel, {
                  as: "span",
                  label: getTranslation(label, i18n),
                  localized: false,
                  path: path,
                  required: false
                })
              })
            }), /*#__PURE__*/_jsx(RenderCustomComponent, {
              CustomComponent: Description,
              Fallback: /*#__PURE__*/_jsx(FieldDescription, {
                description: description,
                path: path
              })
            })]
          }), fieldHasErrors && /*#__PURE__*/_jsx(ErrorPill, {
            count: errorCount,
            i18n: i18n,
            withMessage: true
          })]
        }), BeforeInput, groupHasName(field) ? /*#__PURE__*/_jsx(RenderFields, {
          fields: fields,
          margins: "small",
          parentIndexPath: "",
          parentPath: path,
          parentSchemaPath: schemaPath,
          permissions: permissions === true ? permissions : permissions?.fields,
          readOnly: readOnly
        }) : /*#__PURE__*/_jsx(RenderFields, {
          fields: fields,
          margins: "small",
          parentIndexPath: indexPath,
          parentPath: parentPath,
          parentSchemaPath: parentSchemaPath,
          permissions: permissions,
          readOnly: readOnly
        })]
      })
    }), AfterInput]
  });
};
export { GroupProvider, useGroup };
export const GroupField = withCondition(GroupFieldComponent);
//# sourceMappingURL=index.js.map