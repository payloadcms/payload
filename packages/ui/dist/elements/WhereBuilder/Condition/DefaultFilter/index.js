import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { DateFilter } from '../Date/index.js';
import { NumberFilter } from '../Number/index.js';
import { RelationshipFilter } from '../Relationship/index.js';
import { Select } from '../Select/index.js';
import { Text } from '../Text/index.js';
export const DefaultFilter = ({
  booleanSelect,
  disabled,
  filterOptions,
  internalField,
  onChange,
  operator,
  options,
  value
}) => {
  if (booleanSelect || ['radio', 'select'].includes(internalField?.field?.type)) {
    return /*#__PURE__*/_jsx(Select, {
      disabled: disabled,
      field: internalField.field,
      isClearable: !booleanSelect,
      onChange: onChange,
      operator: operator,
      options: options,
      value: value
    });
  }
  switch (internalField?.field?.type) {
    case 'date':
      {
        return /*#__PURE__*/_jsx(DateFilter, {
          disabled: disabled,
          field: internalField.field,
          onChange: onChange,
          operator: operator,
          value: value
        });
      }
    case 'number':
      {
        return /*#__PURE__*/_jsx(NumberFilter, {
          disabled: disabled,
          field: internalField.field,
          onChange: onChange,
          operator: operator,
          value: value
        });
      }
    case 'relationship':
      {
        return /*#__PURE__*/_jsx(RelationshipFilter, {
          disabled: disabled,
          field: internalField.field,
          filterOptions: filterOptions,
          onChange: onChange,
          operator: operator,
          value: value
        });
      }
    case 'upload':
      {
        return /*#__PURE__*/_jsx(RelationshipFilter, {
          disabled: disabled,
          field: internalField.field,
          filterOptions: filterOptions,
          onChange: onChange,
          operator: operator,
          value: value
        });
      }
    default:
      {
        return /*#__PURE__*/_jsx(Text, {
          disabled: disabled,
          field: internalField?.field,
          onChange: onChange,
          operator: operator,
          value: value
        });
      }
  }
};
//# sourceMappingURL=index.js.map