export default (localization) => (value) => typeof value === 'object'
      && Object.keys(value).some((key) => localization.locales.indexOf(key) > -1);
