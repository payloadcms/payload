const formatName = (string) => {
  return string.replace(/-|\/|\s/g, '_');
};

module.exports = formatName;
