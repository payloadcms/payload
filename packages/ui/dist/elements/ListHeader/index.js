import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
export const listHeaderClass = 'list-header';
export const ListHeader = props => {
  return /*#__PURE__*/_jsxs("header", {
    className: [listHeaderClass, props.className].filter(Boolean).join(' '),
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${listHeaderClass}__content`,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${listHeaderClass}__title-and-actions`,
        children: [/*#__PURE__*/_jsx("h1", {
          className: `${listHeaderClass}__title`,
          children: props.title
        }), props.TitleActions.length ? /*#__PURE__*/_jsx("div", {
          className: `${listHeaderClass}__title-actions`,
          children: props.TitleActions
        }) : null]
      }), props.Actions.length ? /*#__PURE__*/_jsx("div", {
        className: `${listHeaderClass}__actions`,
        children: props.Actions
      }) : null]
    }), props.AfterListHeaderContent ? /*#__PURE__*/_jsx("div", {
      className: `${listHeaderClass}__after-header-content`,
      children: props.AfterListHeaderContent
    }) : null]
  });
};
//# sourceMappingURL=index.js.map