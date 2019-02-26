import httpStatus from 'http-status';

const create = (req, res) => {
  req.model.setDefaultLocale(req.locale); // TODO - move to middleware
  req.model.create(req.body, (err, result) => {
    if (err)
      return res.send(httpStatus.INTERNAL_SERVER_ERROR, { error: err });

    return res.status(httpStatus.CREATED)
      .json({
        message: 'success',
        result: result.toJSON({ virtuals: true })
      });
  });
};

export default create;
