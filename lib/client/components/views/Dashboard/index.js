"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _reactRouterDom = require("react-router-dom");

var _components = require("payload/components");

require("./index.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = function _default() {
  return _react.default.createElement("article", {
    className: "dashboard"
  }, _react.default.createElement(_components.SetStepNav, {
    nav: []
  }), _react.default.createElement("h1", null, "Dashboard"), _react.default.createElement(_reactRouterDom.Link, {
    to: "/login"
  }, "Login"), _react.default.createElement("br", null), _react.default.createElement(_reactRouterDom.Link, {
    to: "/collections/pages"
  }, "Pages Archive"), _react.default.createElement("br", null), _react.default.createElement(_reactRouterDom.Link, {
    to: "/collections/pages/test123"
  }, "Edit Page"));
};

exports.default = _default;
//# sourceMappingURL=index.js.map