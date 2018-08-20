"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _superagentPromise = _interopRequireDefault(require("superagent-promise"));

var _superagent2 = _interopRequireDefault(require("superagent"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var superagent = (0, _superagentPromise.default)(_superagent2.default, global.Promise);

var responseBody = function responseBody(res) {
  return res.body;
};

var requests = {
  GET: function GET(url) {
    return superagent.get("".concat(url)).then(responseBody);
  },
  POST: function POST(url, body) {
    return superagent.post("".concat(url), body).then(responseBody);
  }
};
var _default = {
  requests: requests
};
exports.default = _default;
//# sourceMappingURL=ajax.js.map