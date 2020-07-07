const { me } = require('../../operations');

const meResolver = config => async (_, __, context) => {
  return me({ req: context, config });
};

module.exports = meResolver;
