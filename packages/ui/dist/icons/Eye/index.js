import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Fragment } from 'react';
import './index.scss';
export const EyeIcon = ({
  active = true,
  className
}) => /*#__PURE__*/_jsx("svg", {
  className: [className, 'icon icon--eye'].filter(Boolean).join(' '),
  viewBox: "0 0 16 12",
  xmlns: "http://www.w3.org/2000/svg",
  children: !active ? /*#__PURE__*/_jsxs(Fragment, {
    children: [/*#__PURE__*/_jsx("circle", {
      className: "stroke",
      cx: "8.5",
      cy: "6",
      r: "2.5"
    }), /*#__PURE__*/_jsx("path", {
      className: "stroke",
      d: "M8.5 1C3.83333 1 1.5 6 1.5 6C1.5 6 3.83333 11 8.5 11C13.1667 11 15.5 6 15.5 6C15.5 6 13.1667 1 8.5 1Z"
    })]
  }) : /*#__PURE__*/_jsx(Fragment, {
    children: /*#__PURE__*/_jsx("path", {
      className: "stroke",
      d: "M2 11.5L4.35141 9.51035M15 0.5L12.6486 2.48965M10.915 6.64887C10.6493 7.64011 9.78959 8.38832 8.7408 8.48855M10.4085 4.38511C9.94992 3.84369 9.2651 3.5 8.5 3.5C7.11929 3.5 6 4.61929 6 6C6 6.61561 6.22251 7.17926 6.59149 7.61489M10.4085 4.38511L6.59149 7.61489M10.4085 4.38511L12.6486 2.48965M6.59149 7.61489L4.35141 9.51035M14.1292 3.92915C15.0431 5.02085 15.5 6 15.5 6C15.5 6 13.1667 11 8.5 11C7.67995 11 6.93195 10.8456 6.256 10.5911M4.35141 9.51035C2.45047 8.03672 1.5 6 1.5 6C1.5 6 3.83333 1 8.5 1C10.1882 1 11.5711 1.65437 12.6486 2.48965"
    })
  })
});
//# sourceMappingURL=index.js.map