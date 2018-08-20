"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _reactRouterDom = require("react-router-dom");

var _collections = _interopRequireDefault(require("local/client/components/collections"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = function _default(props) {
  return Object.keys(props.collections).map(function (key, i) {
    return _react.default.createElement(_reactRouterDom.Switch, {
      key: i
    }, _react.default.createElement(_reactRouterDom.Route, {
      path: "/collections/".concat(key, "/add-new"),
      exact: true,
      component: _collections.default[key].Add
    }), _react.default.createElement(_reactRouterDom.Route, {
      path: "/collections/".concat(key),
      exact: true,
      component: _collections.default[key].Archive
    }), _react.default.createElement(_reactRouterDom.Route, {
      path: "/collections/".concat(key, "/:id"),
      component: _collections.default[key].Edit
    }));
  });
};

exports.default = _default;
//# sourceMappingURL=Collections.js.map