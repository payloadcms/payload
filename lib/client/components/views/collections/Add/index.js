"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _components = require("payload/components");

require("./index.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = function _default(props) {
  return _react.default.createElement("article", {
    className: "collection-add collection-".concat(props.slug)
  }, _react.default.createElement(_components.SetStepNav, {
    nav: [{
      url: "/collections/".concat(props.slug),
      label: props.collection.attrs.label
    }, {
      label: 'Add New'
    }]
  }), props.children);
};

exports.default = _default;
//# sourceMappingURL=index.js.map