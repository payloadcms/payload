/* eslint-disable no-param-reassign */
const { refresh } = require('../../operations');
const getExtractJWT = require('../../getExtractJWT');

const refreshResolver = (config, collection) => async (_, __, context) => {
  const extractJWT = getExtractJWT(config);
  const token = extractJWT(context);

  const options = {
    config,
    collection,
    token,
    req: context,
  };

  const result = await refresh(options);

  return result;
};

module.exports = refreshResolver;
