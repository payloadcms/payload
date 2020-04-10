const uppercase = require('./uppercase');

const formatName = (string) => {
  const formatted = string
    .replace(/\./g, '_')
    .replace(/-|\//g, '_')
    .replace(/ /g, '');

  return formatted;
};

module.exports = formatName;
