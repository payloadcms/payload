import httpStatus from 'http-status';
import { NotFound } from '../../errors';

const destroy = (req, res) => {
  req.model.findOneAndDelete({ _id: req.params.id }, (err, doc) => {
    if (err) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: err });
      return;
    }

    if (!doc) {
      res.status(httpStatus.NOT_FOUND)
        .json(new NotFound());
      return;
    }

    res.status(httpStatus.OK)
      .send({ result: 'success' });
  });
};

export default destroy;
