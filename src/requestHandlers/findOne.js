import httpStatus from 'http-status';
import { modelById } from '../resolvers';

const findOne = (req, res) => {

  const query = {
    Model: req.model,
    id: req.params._id,
    locale: req.locale,
    fallback: req.query['fallback-locale']
  };

  if (res) {
    modelById(query)
      .then(doc => res.json(doc))
      .catch(err => res.status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: err }));
  }
  return modelById(query, true);
};

export default findOne;
