"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Payload = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * Module dependencies.
 */
var api = require('./api');

var Payload =
/*#__PURE__*/
function () {
  function Payload(options) {
    var _this = this;

    _classCallCheck(this, Payload);

    this.express = options.express;
    this.mongoose = options.mongoose;
    this.baseURL = options.baseURL;
    this.models = []; // TODO: Investigate creating an API controller to encapsulate

    this.express.get('/api', function (req, res) {
      // TODO: Possible return basic API info and/or HATEOAS info to other routes
      res.status(200).send({
        models: _this.models
      });
    });
  }

  _createClass(Payload, [{
    key: "loadModel",
    value: function loadModel(modelName) {
      console.log("Loading ".concat(modelName, " model...")); // TODO: Require file, validate schema, mount routes instead of just adding to array

      var model = _defineProperty({}, modelName, {});

      if (!this.models[modelName]) {
        this.models.push(model);
        console.log("".concat(modelName, " Loaded."));
      }
    }
  }]);

  return Payload;
}();

exports.Payload = Payload;
//# sourceMappingURL=payload.js.map