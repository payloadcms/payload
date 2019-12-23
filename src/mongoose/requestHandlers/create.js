import httpStatus from 'http-status';

const create = (req, res) => {
  req.model.create(req.body, (err, result) => {
    if (err)
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });

    return res.status(httpStatus.CREATED)
      .json({
        message: 'success',
        result: result.toJSON({ virtuals: true }),
      });
  });
};

export default create;
