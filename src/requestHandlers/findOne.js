import httpStatus from 'http-status';
import { modelById } from '../resolvers';
import {createAutopopulateOptions} from '../helpers/mongoose/createAutopopulateOptions';

const findOne = (req, res) => {

  const query = {
    Model: req.model,
    id: req.params._id,
    locale: req.locale,
    fallback: req.query['fallback-locale']
  };
  modelById(query, {...createAutopopulateOptions(req.query.depth)})
    .then(doc => res.json(doc))
    .catch(err => res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err }));
};

export default findOne;
