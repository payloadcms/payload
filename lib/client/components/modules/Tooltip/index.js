"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

require("./Tooltip.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = function _default(props) {
  var className = props.className ? "tooltip ".concat(props.className) : 'tooltip';
  return _react.default.createElement("aside", {
    className: className
  }, props.children, _react.default.createElement("span", null));
};

exports.default = _default;
//# sourceMappingURL=index.js.map