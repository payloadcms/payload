const formatName = require('./formatName');

const combineParentName = (parent, name) => {
  return formatName(`${parent ? `${parent}_` : ''}${name}`);
};

module.exports = combineParentName;
