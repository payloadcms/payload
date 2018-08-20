"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _components = require("payload/components");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = function _default(props) {
  return _react.default.createElement("div", {
    className: "api-url"
  }, _react.default.createElement(_components.Label, {
    className: "uppercase"
  }, "API URL\xA0\u2014\xA0Edit"), _react.default.createElement("div", null, _react.default.createElement("a", {
    href: props.url
  }, props.url)));
};

exports.default = _default;
//# sourceMappingURL=index.js.map