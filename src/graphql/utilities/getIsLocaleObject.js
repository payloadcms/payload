module.exports = (localization, value) => {
  return typeof value === 'object'
    && Object.keys(value).every(key => localization.locales.indexOf(key) > -1);
};
