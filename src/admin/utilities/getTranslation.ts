export const getTranslation = (label: Record<string, string> | string | JSX.Element, i18n): string => {
  if (typeof label === 'object') {
    if (label[i18n.language]) {
      return label[i18n.language];
    }
    let fallbacks = [];
    if (typeof i18n.options.fallbackLng === 'object') {
      fallbacks = Object.keys(i18n.options.fallbackLng);
    } else if (Array.isArray(i18n.options.fallbackLng)) {
      fallbacks = typeof i18n.options.fallbackLng === 'string' ? [i18n.options.fallbackLng] : i18n.options.fallbackLng;
    } else if (typeof i18n.options.fallbackLng === 'function') {
      console.warn('Use of i18next fallbackLng functions are not supported.');
    }
    return fallbacks.find((language) => (label[language])) ?? label[Object.keys(label)[0]];
  }
  return label;
};
