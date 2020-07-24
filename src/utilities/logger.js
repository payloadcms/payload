const falsey = require('falsey');
const pino = require('pino');
const memoize = require('micro-memoize');

module.exports = memoize((name) => {
  return pino({
    name,
    enabled: falsey(process.env.DISABLE_LOGGING),
  });
});
