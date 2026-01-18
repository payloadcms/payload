'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './index.scss';
import React, { useMemo } from 'react';
import { SelectInput } from '../../fields/Select/Input.js';
import { useAuth } from '../../providers/Auth/index.js';
import { useListQuery } from '../../providers/ListQuery/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { reduceFieldsToOptions } from '../../utilities/reduceFieldsToOptions.js';
import { ReactSelect } from '../ReactSelect/index.js';
const baseClass = 'group-by-builder';
/**
 * Note: Some fields are already omitted from the list of fields:
 * - fields with nested field, e.g. `tabs`, `groups`, etc.
 * - fields that don't affect data, i.e. `row`, `collapsible`, `ui`, etc.
 * So we don't technically need to omit them here, but do anyway.
 * But some remaining fields still need an additional check, e.g. `richText`, etc.
 */
const supportedFieldTypes = ['text', 'textarea', 'number', 'select', 'relationship', 'date', 'checkbox', 'radio', 'email', 'number', 'upload'];
export const GroupByBuilder = ({
  collectionSlug,
  fields
}) => {
  const {
    i18n,
    t
  } = useTranslation();
  const {
    permissions
  } = useAuth();
  const fieldPermissions = permissions?.collections?.[collectionSlug]?.fields;
  const reducedFields = useMemo(() => reduceFieldsToOptions({
    fieldPermissions,
    fields,
    i18n
  }), [fields, fieldPermissions, i18n]);
  const {
    query,
    refineListData
  } = useListQuery();
  const groupByFieldName = query.groupBy?.replace(/^-/, '');
  const groupByField = reducedFields.find(field => field.value === groupByFieldName);
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__header`,
      children: [/*#__PURE__*/_jsx("p", {
        children: t('general:groupByLabel', {
          label: ''
        })
      }), query.groupBy && /*#__PURE__*/_jsx("button", {
        className: `${baseClass}__clear-button`,
        id: "group-by--reset",
        onClick: async () => {
          await refineListData({
            groupBy: ''
          });
        },
        type: "button",
        children: t('general:clear')
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__inputs`,
      children: [/*#__PURE__*/_jsx(ReactSelect, {
        filterOption: (option, inputValue) => (option?.data?.plainTextLabel || option.label).toLowerCase().includes(inputValue.toLowerCase()),
        id: "group-by--field-select",
        isClearable: true,
        isMulti: false,
        onChange: async v => {
          const value = v === null ? undefined : v.value;
          // value is being cleared
          if (v === null) {
            await refineListData({
              groupBy: '',
              page: 1
            });
          }
          await refineListData({
            groupBy: value ? query.groupBy?.startsWith('-') ? `-${value}` : value : undefined,
            page: 1
          });
        },
        options: reducedFields.filter(field_0 => !field_0.field.admin.disableGroupBy && field_0.value !== 'id' && supportedFieldTypes.includes(field_0.field.type)),
        value: {
          label: groupByField?.label || t('general:selectValue'),
          value: groupByFieldName || ''
        }
      }), /*#__PURE__*/_jsx(SelectInput, {
        id: "group-by--sort",
        isClearable: false,
        name: "direction",
        onChange: async ({
          value: value_0
        }) => {
          if (!groupByFieldName) {
            return;
          }
          await refineListData({
            groupBy: value_0 === 'asc' ? groupByFieldName : `-${groupByFieldName}`,
            page: 1
          });
        },
        options: [{
          label: t('general:ascending'),
          value: 'asc'
        }, {
          label: t('general:descending'),
          value: 'desc'
        }],
        path: "direction",
        readOnly: !groupByFieldName,
        value: !query.groupBy ? 'asc' : typeof query.groupBy === 'string' ? `${query.groupBy.startsWith('-') ? 'desc' : 'asc'}` : ''
      })]
    })]
  });
};
//# sourceMappingURL=index.js.map