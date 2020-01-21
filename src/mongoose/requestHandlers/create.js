const httpStatus = require('http-status');
const formatErrorResponse = require('../../errors/formatResponse');

const create = (req, res) => {
  req.model.create(req.body, (err, result) => {
    if (err) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(formatErrorResponse(err, 'mongoose'));
      return;
    }

    res.status(httpStatus.CREATED)
      .json({
        message: 'success',
        result: result.toJSON({ virtuals: true }),
      });
  });
};

module.exports = create;
