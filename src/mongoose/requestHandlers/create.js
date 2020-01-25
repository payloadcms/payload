const httpStatus = require('http-status');
const formatErrorResponse = require('../../responses/formatError');
const formatSuccessResponse = require('../../responses/formatSuccess');

const create = (req, res) => {
  req.model.create(req.body, (err) => {
    if (err) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(formatErrorResponse(err, 'mongoose'));
    }

    return res.status(httpStatus.CREATED)
      .json(formatSuccessResponse(`${req.collection.labels.singular} successfully created.`, 'message'));
  });
};

module.exports = create;
