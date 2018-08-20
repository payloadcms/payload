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
    className: "collection-archive"
  }, _react.default.createElement(_components.SetStepNav, {
    nav: [{
      label: props.collection.attrs.label
    }]
  }), props.children);
};

exports.default = _default;
//# sourceMappingURL=index.js.map