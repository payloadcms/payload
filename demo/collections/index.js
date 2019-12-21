const Category = require('./Category');
const User = require('./User');
const Page = require('./Page');

module.exports = (payload) => {
  payload.registerCollection(Page);
  payload.registerCollection(User);
  payload.registerCollection(Category);
};
