"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _components = require("payload/components");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = function _default(props) {
  return _react.default.createElement("article", {
    className: "collection-edit"
  }, _react.default.createElement(_components.SetStepNav, {
    nav: [{
      url: "/collections/".concat(props.slug),
      label: props.collection.attrs.label
    }, {
      url: "/collections/".concat(props.slug, "/").concat(props.id),
      label: props.id
    }]
  }), props.children);
};

exports.default = _default;
//# sourceMappingURL=index.js.map