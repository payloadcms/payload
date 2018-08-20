"use strict";

module.exports = function (payload) {
  var route = '/api/testmodel';
  payload.express.get(route, function (req, res) {
    res.sendStatus(200);
  });
  payload.express.post(route, function (req, res) {
    res.sendStatus(201);
  });
};
//# sourceMappingURL=testModel.js.map