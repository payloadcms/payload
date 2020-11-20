module.exports = (localization) => {
  return (value) => {
    return typeof value === 'object'
      && Object.keys(value).some(key => localization.locales.indexOf(key) > -1);
  };
};
