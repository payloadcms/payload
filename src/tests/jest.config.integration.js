const defaults = require('./jest.config');

module.exports = {
  ...defaults,
  roots: [
    './integration'
  ],
};
