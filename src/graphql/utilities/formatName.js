const uppercase = require('./uppercase');

const formatName = (string) => {
  let formatted = string.replace(/-|\//g, '_');
  formatted = uppercase(formatted);
  formatted = formatted.replace(/ /g, '');
  return formatted;
};

module.exports = formatName;
