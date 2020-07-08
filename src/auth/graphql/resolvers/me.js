const { me } = require('../../operations');

const meResolver = (config) => async (_, __, context) => me({ req: context, config });

module.exports = meResolver;
