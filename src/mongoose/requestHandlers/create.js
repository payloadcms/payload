const httpStatus = require('http-status');

const create = (req, res) => {
  req.model.create(req.body, (err, result) => {
    if (err) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ err });
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
