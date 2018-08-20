"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

require("./index.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = function _default(props) {
  var classes = props.className ? props.className : undefined;
  return _react.default.createElement("label", {
    className: classes
  }, props.children);
};

exports.default = _default;
//# sourceMappingURL=index.js.map