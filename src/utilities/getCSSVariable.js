const getCSSVariable = (variable) => getComputedStyle(document.documentElement).getPropertyValue(`--${variable}`);
module.exports = getCSSVariable;
