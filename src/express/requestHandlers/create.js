const httpStatus = require('http-status');
const formatErrorResponse = require('../../responses/formatError');
const formatSuccessResponse = require('../../responses/formatSuccess');

const create = (req, res) => {
  req.model.create(req.body, (err, doc) => {
    if (err) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(formatErrorResponse(err, 'mongoose'));
    }

    return res.status(httpStatus.CREATED)
      .json({
        ...formatSuccessResponse(`${req.collection.labels.singular} successfully created.`, 'message'),
        doc: doc.toJSON({ virtuals: true }),
      });
  });
};

module.exports = create;
