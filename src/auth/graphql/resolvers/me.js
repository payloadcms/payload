const { me } = require('../../operations');

const meResolver = (config) => async (_, __, context) => me({ req: context.req, config });

module.exports = meResolver;
