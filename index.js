require('@babel/register')({
  ignore: [/(node_modules)/],
});

module.exports = require('./src');
