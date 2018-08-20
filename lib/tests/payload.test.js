"use strict";

var _express = _interopRequireDefault(require("express"));

var _mongoose = _interopRequireDefault(require("mongoose"));

var _supertest = _interopRequireDefault(require("supertest"));

var _ = require("../");

var utils = _interopRequireWildcard(require("./testUtils"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable global-require */
var app = (0, _express.default)();

function initBasicPayload() {
  return new _.Payload({
    express: app,
    mongoose: _mongoose.default,
    baseURL: 'localhost'
  });
}

describe('Basic Payload Tests', function () {
  test('Instantiate Payload', function () {
    var payload = initBasicPayload();
    expect(payload).toBeDefined();
  });
});
describe('API route tests', function () {
  test('Mount /api route', function (done) {
    var expressApp = utils.getConfiguredExpress();
    var payload = new _.Payload({
      express: expressApp,
      mongoose: _mongoose.default,
      baseURL: 'localhost'
    });
    var server = expressApp.listen(3000);
    (0, _supertest.default)(expressApp).get('/api').then(function (response) {
      expect(response.statusCode).toEqual(200);
      server.close();
      done();
    });
  });
  test('Mount /api/testmodel GET route', function (done) {
    var expressApp = utils.getConfiguredExpress();
    var payload = new _.Payload({
      express: expressApp,
      mongoose: _mongoose.default,
      baseURL: 'localhost'
    }); // File contains what a developer would write

    require('./models/testModel')(payload);

    var server = expressApp.listen(3000);
    (0, _supertest.default)(expressApp).get('/api/testmodel').then(function (response) {
      expect(response.statusCode).toEqual(200);
      server.close();
      done();
    });
  });
  test('Mount /api/testmodel POST route', function (done) {
    var expressApp = utils.getConfiguredExpress();
    var payload = new _.Payload({
      express: expressApp,
      mongoose: _mongoose.default,
      baseURL: 'localhost'
    }); // File contains what a developer would write

    require('./models/testModel')(payload);

    var server = expressApp.listen(3000);
    (0, _supertest.default)(expressApp).post('/api/testmodel').then(function (response) {
      expect(response.statusCode).toEqual(201);
      server.close();
      done();
    });
  });
});
//# sourceMappingURL=payload.test.js.map