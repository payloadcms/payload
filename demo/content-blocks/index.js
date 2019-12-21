const Quote = require('./Quote');
const CallToAction = require('./CallToAction');

module.exports = (payload) => {
  payload.registerCollection(CallToAction);
  payload.registerCollection(Quote);
};
