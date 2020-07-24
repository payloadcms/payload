const falsey = require('falsey');
const pino = require('pino');
const memoize = require('micro-memoize');

// eslint-disable-next-line arrow-body-style
module.exports = memoize((name = 'payload') => {
  return pino({
    name,
    enabled: falsey(process.env.DISABLE_LOGGING),
    prettyPrint: {
      ignore: 'pid,hostname',
      translateTime: 'HH:MM:ss',
    },
  });
});
