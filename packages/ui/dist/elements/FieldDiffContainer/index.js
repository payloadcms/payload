import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './index.scss';
import { getTranslation } from '@payloadcms/translations';
import { FieldDiffLabel } from '../FieldDiffLabel/index.js';
const baseClass = 'field-diff';
export const FieldDiffContainer = args => {
  const {
    className,
    From,
    i18n,
    label: {
      label,
      locale
    },
    nestingLevel = 0,
    To
  } = args;
  return /*#__PURE__*/_jsxs("div", {
    className: `${baseClass}-container${className ? ` ${className}` : ''} nested-level-${nestingLevel}`,
    style: nestingLevel ? {
      // Need to use % instead of fr, as calc() doesn't work with fr when this is used in gridTemplateColumns
      '--left-offset': `calc(50%  - (${nestingLevel} * calc( calc(var(--base)* 0.5) - 2.5px  )))`
    } : {
      '--left-offset': '50%'
    },
    children: [/*#__PURE__*/_jsxs(FieldDiffLabel, {
      children: [locale && /*#__PURE__*/_jsx("span", {
        className: `${baseClass}__locale-label`,
        children: locale
      }), typeof label !== 'function' && getTranslation(label || '', i18n)]
    }), /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}-content`,
      style: nestingLevel ? {
        gridTemplateColumns: `calc(var(--left-offset) - calc(var(--base)*0.5) )     calc(50% - calc(var(--base)*0.5) + calc(50% - var(--left-offset)))`
      } : undefined,
      children: [From, To]
    })]
  });
};
//# sourceMappingURL=index.js.map