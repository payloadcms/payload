import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from 'react';
import { RenderCustomComponent } from '../elements/RenderCustomComponent/index.js';
import { FieldLabel } from '../fields/FieldLabel/index.js';
export const combineFieldLabel = ({
  CustomLabel,
  field,
  prefix
}) => {
  return /*#__PURE__*/_jsxs(Fragment, {
    children: [prefix ? /*#__PURE__*/_jsxs(Fragment, {
      children: [/*#__PURE__*/_jsx("span", {
        style: {
          display: 'inline-block'
        },
        children: prefix
      }), ' > ']
    }) : null, /*#__PURE__*/_jsx("span", {
      style: {
        display: 'inline-block'
      },
      children: /*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: CustomLabel,
        Fallback: /*#__PURE__*/_jsx(FieldLabel, {
          label: 'label' in field && field.label
        })
      })
    })]
  });
};
//# sourceMappingURL=combineFieldLabel.js.map