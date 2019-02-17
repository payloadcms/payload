import httpStatus from 'http-status';

const destroy = (req, res) => {
  req.model.findOneAndDelete({ _id: req.params._id }, (err, doc) => {
    if (err)
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });

    if (!doc)
      return res.status(httpStatus.NOT_FOUND).send('Not Found');

    return res.send();
  });
};

export default destroy;
