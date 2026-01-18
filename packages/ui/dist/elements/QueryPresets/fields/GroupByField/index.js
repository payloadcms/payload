'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { toWords } from 'payload/shared';
import React, { useMemo } from 'react';
import { FieldLabel } from '../../../../fields/FieldLabel/index.js';
import { useField } from '../../../../forms/useField/index.js';
import { useAuth } from '../../../../providers/Auth/index.js';
import { useConfig } from '../../../../providers/Config/index.js';
import { useTranslation } from '../../../../providers/Translation/index.js';
import { reduceFieldsToOptions } from '../../../../utilities/reduceFieldsToOptions.js';
import { Pill } from '../../../Pill/index.js';
import './index.scss';
export const QueryPresetsGroupByField = ({
  field: {
    label,
    required
  }
}) => {
  const {
    path,
    value
  } = useField();
  const {
    i18n
  } = useTranslation();
  const {
    permissions
  } = useAuth();
  const {
    config
  } = useConfig();
  // Get the relatedCollection from the document data
  const relatedCollectionField = useField({
    path: 'relatedCollection'
  });
  const relatedCollection = relatedCollectionField.value;
  // Get the collection config for the related collection
  const collectionConfig = useMemo(() => {
    if (!relatedCollection) {
      return null;
    }
    return config.collections?.find(col => col.slug === relatedCollection);
  }, [relatedCollection, config.collections]);
  // Reduce fields to options to get proper labels
  const reducedFields = useMemo(() => {
    if (!collectionConfig) {
      return [];
    }
    const fieldPermissions = permissions?.collections?.[relatedCollection]?.fields;
    return reduceFieldsToOptions({
      fieldPermissions,
      fields: collectionConfig.fields,
      i18n
    });
  }, [collectionConfig, permissions, relatedCollection, i18n]);
  const renderGroupBy = groupByValue => {
    if (!groupByValue) {
      return 'No group by selected';
    }
    const isDescending = groupByValue.startsWith('-');
    const fieldName = isDescending ? groupByValue.slice(1) : groupByValue;
    const direction = isDescending ? 'descending' : 'ascending';
    // Find the field option to get the proper label
    const fieldOption = reducedFields.find(field => field.value === fieldName);
    const displayLabel = fieldOption?.label || toWords(fieldName);
    return /*#__PURE__*/_jsxs(Pill, {
      pillStyle: "always-white",
      size: "small",
      children: [/*#__PURE__*/_jsx("b", {
        children: displayLabel
      }), " (", direction, ")"]
    });
  };
  return /*#__PURE__*/_jsxs("div", {
    className: "field-type query-preset-group-by-field",
    children: [/*#__PURE__*/_jsx(FieldLabel, {
      as: "h3",
      label: label,
      path: path,
      required: required
    }), /*#__PURE__*/_jsx("div", {
      className: "value-wrapper",
      children: renderGroupBy(value)
    })]
  });
};
//# sourceMappingURL=index.js.map