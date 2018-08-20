"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _reactRouterDom = require("react-router-dom");

var _components = require("payload/components");

var _Logo = _interopRequireDefault(require("local/client/components/graphics/Logo"));

require("./index.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = function _default() {
  return _react.default.createElement(_components.ContentBlock, {
    className: "login",
    width: "narrow"
  }, _react.default.createElement(_Logo.default, null), _react.default.createElement(_components.Form, {
    method: "POST",
    action: "http://localhost:8080"
  }, _react.default.createElement(_components.Input, {
    type: "email",
    label: "Email Address",
    name: "email",
    required: true
  }), _react.default.createElement(_components.Input, {
    type: "password",
    label: "Password",
    name: "password",
    required: true
  }), _react.default.createElement(_components.Button, {
    type: "submit"
  }, "Log In")), _react.default.createElement(_reactRouterDom.Link, {
    to: "/"
  }, "To Dashboard"));
};

exports.default = _default;
//# sourceMappingURL=index.js.map