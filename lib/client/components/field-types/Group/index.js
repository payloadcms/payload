"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

require("./index.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = function _default(props) {
  var Heading = props.heading ? function () {
    return _react.default.createElement("header", null, _react.default.createElement("h2", null, props.heading));
  } : function () {
    return null;
  };
  return _react.default.createElement("section", {
    className: "field-group"
  }, _react.default.createElement(Heading, null), _react.default.createElement("div", {
    className: "content"
  }, props.children));
};

exports.default = _default;
//# sourceMappingURL=index.js.map