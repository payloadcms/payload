"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getConfiguredExpress = getConfiguredExpress;

var _express = _interopRequireDefault(require("express"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getConfiguredExpress() {
  var expressApp = (0, _express.default)();
  expressApp.set('view engine', 'pug');
  return expressApp;
}
//# sourceMappingURL=testUtils.js.map