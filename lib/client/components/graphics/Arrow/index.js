"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = function _default(props) {
  return _react.default.createElement("svg", {
    className: "icon arrow",
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 200 199.35"
  }, _react.default.createElement("line", {
    className: "stroke",
    stroke: props.color,
    x1: "12.5",
    y1: "99.8",
    x2: "192.8",
    y2: "99.8"
  }), _react.default.createElement("polyline", {
    className: "stroke",
    stroke: props.color,
    points: "102.5,190.1 192.8,99.8 102.5,9.5 "
  }));
};

exports.default = _default;
//# sourceMappingURL=index.js.map