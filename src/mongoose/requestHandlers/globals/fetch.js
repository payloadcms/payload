import httpStatus from 'http-status';
import { findOne } from '../../resolvers';
import { createAutopopulateOptions } from '../../createAutopopulateOptions';

const fetch = (req, res) => {
  const query = {
    Model: req.model,
    locale: req.locale,
    fallback: req.query['fallback-locale'],
    depth: req.query.depth
  };

  findOne(query, createAutopopulateOptions(query))
    .then(doc => res.json(doc))
    .catch(err => res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err }));
};

export default fetch;
