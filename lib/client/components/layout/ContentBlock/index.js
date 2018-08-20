"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

require("./index.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = function _default(props) {
  var classes = props.className ? "content-block ".concat(props.className) : 'content-block';
  classes = props.width ? "".concat(classes, " ").concat(props.width) : classes;
  return _react.default.createElement("section", {
    className: classes
  }, props.children);
};

exports.default = _default;
//# sourceMappingURL=index.js.map